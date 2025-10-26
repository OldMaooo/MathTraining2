import { CloudStore } from './cloudStore';

export interface Account {
  id: string;
  name: string;
  type: 'admin' | 'user';
  createdAt: number;
  lastActiveAt: number;
}

export class AccountService {
  private static instance: AccountService;
  private currentAccountId: string | null = null;
  private recentAccountIds: string[] = [];

  private constructor() {}

  public static getInstance(): AccountService {
    if (!AccountService.instance) {
      AccountService.instance = new AccountService();
    }
    return AccountService.instance;
  }

  // 获取所有账号
  getAccounts(): Account[] {
    const accountsData = localStorage.getItem('mp-accounts');
    if (accountsData) {
      try {
        const accounts = JSON.parse(accountsData);
        // 迁移旧格式的账号ID到新格式
        return this.migrateAccountIds(accounts);
      } catch {
        return [];
      }
    }
    return [];
  }

  // 迁移旧格式的账号ID到新格式
  private migrateAccountIds(accounts: Account[]): Account[] {
    let needsSave = false;
    const migratedAccounts = accounts.map(account => {
      // 检查是否是旧格式的ID（时间戳格式）
      if (/^\d{13}[a-z0-9]+$/.test(account.id)) {
        needsSave = true;
        // 生成新的稳定ID
        const newId = `user:${account.name}`;
        console.log(`[AccountMigration] 迁移账号ID: ${account.id} -> ${newId}`);
        return { ...account, id: newId };
      }
      return account;
    });

    if (needsSave) {
      this.saveAccounts(migratedAccounts);
      console.log('[AccountMigration] 账号ID迁移完成');
    }

    return migratedAccounts;
  }

  // 确保云端同步已启用
  ensureCloudSyncEnabled(): void {
    if (localStorage.getItem('mp-cloud-sync') !== '1') {
      localStorage.setItem('mp-cloud-sync', '1');
      console.log('[CloudSync] 自动启用云端同步');
    }
  }

  // 保存账号列表
  private saveAccounts(accounts: Account[]): void {
    localStorage.setItem('mp-accounts', JSON.stringify(accounts));
  }

  // 创建新账号
  createAccount(name: string, type?: 'admin' | 'user'): Account {
    const accounts = this.getAccounts();

    // 如果已存在同名账号，直接返回，避免重复
    const existed = accounts.find(a => a.name === name);
    if (existed) {
      return existed;
    }

    // 自动判断账号类型：mao1986为admin，其他为user
    const accountType = type || (name === 'mao1986' ? 'admin' : 'user');

    // 生成跨浏览器稳定的本地ID：基于用户名
    const stableId = `user:${name}`;

    const newAccount: Account = {
      id: stableId,
      name,
      type: accountType,
      createdAt: Date.now(),
      lastActiveAt: Date.now()
    };

    accounts.push(newAccount);
    this.saveAccounts(accounts);
    
    // 云端同步（如果启用）
    try {
      if (localStorage.getItem('mp-cloud-sync') === '1') {
        // 生成一个简单的密码哈希（实际应用中应该更安全）
        const passwordHash = btoa(encodeURIComponent(name + '_password'));
        CloudStore.getInstance().ensureAccount(name, passwordHash, accountType)
          .then(cloudAccountId => {
            console.log('Account synced to cloud:', cloudAccountId);
          })
          .catch(error => {
            console.error('Failed to sync account to cloud:', error);
          });
      }
    } catch (error) {
      console.error('Cloud sync error:', error);
    }
    
    return newAccount;
  }

  // 获取当前账号
  getCurrentAccount(): Account | null {
    const currentId = this.getCurrentAccountId();
    if (!currentId) return null;
    
    const accounts = this.getAccounts();
    const foundAccount = accounts.find(account => account.id === currentId);
    
    if (foundAccount) {
      return foundAccount;
    } else {
      // 如果当前ID对应的账号不存在，清除无效的ID
      console.log('[AccountService] 当前账号ID无效，清除:', currentId);
      this.currentAccountId = null;
      localStorage.removeItem('mp-current-account-id');
      return null;
    }
  }

  // 获取当前账号ID（每次都从localStorage读取，确保数据同步）
  getCurrentAccountId(): string | null {
    const savedId = localStorage.getItem('mp-current-account-id');
    if (savedId) {
      this.currentAccountId = savedId; // 更新缓存
      return savedId;
    }
    this.currentAccountId = null;
    return null;
  }

  // 设置当前账号
  setCurrentAccount(accountId: string): void {
    this.currentAccountId = accountId;
    localStorage.setItem('mp-current-account-id', accountId);
    
    // 更新最近切换的账号列表
    this.addToRecentAccounts(accountId);
    
    // 更新最后活跃时间
    const accounts = this.getAccounts();
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
      account.lastActiveAt = Date.now();
      this.saveAccounts(accounts);
    }
  }

  // 添加到最近账号列表
  private addToRecentAccounts(accountId: string): void {
    this.recentAccountIds = this.getRecentAccountIds();
    
    // 移除已存在的账号ID
    this.recentAccountIds = this.recentAccountIds.filter(id => id !== accountId);
    
    // 添加到开头
    this.recentAccountIds.unshift(accountId);
    
    // 限制最多保存5个最近账号
    this.recentAccountIds = this.recentAccountIds.slice(0, 5);
    
    // 保存到localStorage
    localStorage.setItem('mp-recent-account-ids', JSON.stringify(this.recentAccountIds));
  }

  // 获取最近账号ID列表
  private getRecentAccountIds(): string[] {
    const saved = localStorage.getItem('mp-recent-account-ids');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  }

  // 获取最近切换的账号（排除当前账号）
  getRecentAccounts(): Account[] {
    const recentIds = this.getRecentAccountIds();
    const currentId = this.getCurrentAccountId();
    const accounts = this.getAccounts();
    
    // 过滤掉当前账号，只返回最近切换过的账号
    return recentIds
      .filter(id => id !== currentId)
      .map(id => accounts.find(acc => acc.id === id))
      .filter((acc): acc is Account => acc !== undefined)
      .slice(0, 3); // 最多显示3个最近账号
  }

  // 删除账号
  deleteAccount(accountId: string): void {
    const accounts = this.getAccounts();
    const filteredAccounts = accounts.filter(acc => acc.id !== accountId);
    this.saveAccounts(filteredAccounts);
    
    // 如果删除的是当前账号，切换到第一个可用账号
    if (this.getCurrentAccountId() === accountId) {
      if (filteredAccounts.length > 0) {
        this.setCurrentAccount(filteredAccounts[0].id);
      } else {
        this.currentAccountId = null;
        localStorage.removeItem('mp-current-account-id');
      }
    }
  }

  // 更新账号名称
  updateAccountName(accountId: string, newName: string): void {
    const accounts = this.getAccounts();
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
      account.name = newName;
      this.saveAccounts(accounts);
    }
  }

  // 获取或创建默认账号
  getOrCreateDefaultAccount(): Account {
    const accounts = this.getAccounts();
    if (accounts.length === 0) {
      return this.createAccount('默认用户', 'user');
    }
    
    const currentId = this.getCurrentAccountId();
    if (currentId && accounts.find(acc => acc.id === currentId)) {
      return accounts.find(acc => acc.id === currentId)!;
    }
    
    // 设置第一个账号为当前账号
    this.setCurrentAccount(accounts[0].id);
    return accounts[0];
  }

  // 根据用户名查找账号
  findAccountByName(name: string): Account | null {
    const accounts = this.getAccounts();
    return accounts.find(account => account.name === name) || null;
  }

  // 登录已有账号（如果不存在则创建）
  loginOrCreateAccount(name: string, type?: 'admin' | 'user'): Account {
    const existingAccount = this.findAccountByName(name);
    if (existingAccount) {
      // 账号已存在，切换到该账号
      this.setCurrentAccount(existingAccount.id);
      return existingAccount;
    } else {
      // 账号不存在，创建新账号（自动判断类型）
      const newAccount = this.createAccount(name, type);
      this.setCurrentAccount(newAccount.id);
      return newAccount;
    }
  }
}
