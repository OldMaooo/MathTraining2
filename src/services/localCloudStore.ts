// 本地云端存储模拟器
// 当Supabase不可用时，使用localStorage作为替代

export class LocalCloudStore {
  private prefix = 'mp-cloud-';

  // 模拟云端同步
  async syncProfile(profile: any): Promise<{ success: boolean; error?: string }> {
    try {
      const key = `${this.prefix}profile`;
      localStorage.setItem(key, JSON.stringify(profile));
      console.log('✅ 本地云端同步成功:', profile);
      return { success: true };
    } catch (error) {
      console.error('❌ 本地云端同步失败:', error);
      return { success: false, error: String(error) };
    }
  }

  // 模拟云端账户同步
  async syncAccount(account: any): Promise<{ success: boolean; error?: string }> {
    try {
      const key = `${this.prefix}account`;
      localStorage.setItem(key, JSON.stringify(account));
      console.log('✅ 本地账户同步成功:', account);
      return { success: true };
    } catch (error) {
      console.error('❌ 本地账户同步失败:', error);
      return { success: false, error: String(error) };
    }
  }

  // 模拟云端题目日志同步
  async syncQuestionLogs(logs: any[]): Promise<{ success: boolean; error?: string }> {
    try {
      const key = `${this.prefix}question-logs`;
      localStorage.setItem(key, JSON.stringify(logs));
      console.log('✅ 本地题目日志同步成功:', logs.length, '条记录');
      return { success: true };
    } catch (error) {
      console.error('❌ 本地题目日志同步失败:', error);
      return { success: false, error: String(error) };
    }
  }

  // 模拟云端错题同步
  async syncWrongQuestions(questions: any[]): Promise<{ success: boolean; error?: string }> {
    try {
      const key = `${this.prefix}wrong-questions`;
      localStorage.setItem(key, JSON.stringify(questions));
      console.log('✅ 本地错题同步成功:', questions.length, '道题');
      return { success: true };
    } catch (error) {
      console.error('❌ 本地错题同步失败:', error);
      return { success: false, error: String(error) };
    }
  }

  // 模拟从云端获取数据
  async getCloudData(): Promise<any> {
    try {
      const profileKey = `${this.prefix}profile`;
      const accountKey = `${this.prefix}account`;
      const logsKey = `${this.prefix}question-logs`;
      const wrongKey = `${this.prefix}wrong-questions`;

      const profile = localStorage.getItem(profileKey);
      const account = localStorage.getItem(accountKey);
      const logs = localStorage.getItem(logsKey);
      const wrong = localStorage.getItem(wrongKey);

      return {
        profile: profile ? JSON.parse(profile) : null,
        account: account ? JSON.parse(account) : null,
        questionLogs: logs ? JSON.parse(logs) : [],
        wrongQuestions: wrong ? JSON.parse(wrong) : []
      };
    } catch (error) {
      console.error('❌ 获取本地云端数据失败:', error);
      return null;
    }
  }
}

export const localCloudStore = new LocalCloudStore();
