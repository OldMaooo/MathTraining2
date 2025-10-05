export interface Account {
  id: string;
  name: string;
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
        return JSON.parse(accountsData);
      } catch {
        return [];
      }
    }
    return [];
  }

  // 保存账号列表
  private saveAccounts(accounts: Account[]): void {
    localStorage.setItem('mp-accounts', JSON.stringify(accounts));
  }

  // 创建新账号
  createAccount(name: string): Account {
    const accounts = this.getAccounts();
    const newAccount: Account = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name,
      createdAt: Date.now(),
      lastActiveAt: Date.now()
    };
    
    accounts.push(newAccount);
    this.saveAccounts(accounts);
    return newAccount;
  }

  // 获取当前账号
  getCurrentAccount(): Account | null {
    const currentId = this.getCurrentAccountId();
    if (!currentId) return null;
    
    const accounts = this.getAccounts();
    return accounts.find(account => account.id === currentId) || null;
  }

  // 获取当前账号ID
  getCurrentAccountId(): string | null {
    if (this.currentAccountId) return this.currentAccountId;
    
    const savedId = localStorage.getItem('mp-current-account-id');
    if (savedId) {
      this.currentAccountId = savedId;
      return savedId;
    }
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
      return this.createAccount('默认用户');
    }
    
    const currentId = this.getCurrentAccountId();
    if (currentId && accounts.find(acc => acc.id === currentId)) {
      return accounts.find(acc => acc.id === currentId)!;
    }
    
    // 设置第一个账号为当前账号
    this.setCurrentAccount(accounts[0].id);
    return accounts[0];
  }
}
