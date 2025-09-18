import type { Question } from './generator';

export type ErrorType = 'borrow' | 'carry' | 'careless' | 'timeout' | 'operation';

export interface Attempt {
  questionId: string;
  answer: number | null;
  correct: boolean;
  timeMs: number;
  errorType?: ErrorType;
  timestamp: number;
}

export class ErrorClassifier {
  /**
   * 分类错误类型
   */
  classify(question: Question, answer: number | null, timeMs: number, timeLimit: number): ErrorType | null {
    // 超时错误
    if (timeMs > timeLimit * 1000) {
      return 'timeout';
    }
    
    // 没有答案
    if (answer === null) {
      return 'timeout';
    }
    
    // 正确答案
    if (answer === question.correctAnswer) {
      return null;
    }
    
    // 运算符号错误（加法算成减法或相反）
    if (this.isOperationError(question, answer)) {
      return 'operation';
    }
    
    // 退位错误（减法中个位借位处理错误）
    if (question.operation === '-' && question.hasBorrow && this.isBorrowError(question, answer)) {
      return 'borrow';
    }
    
    // 进位错误（加法中进位处理错误）
    if (question.operation === '+' && this.isCarryError(question, answer)) {
      return 'carry';
    }
    
    // 其他错误归类为粗心错误
    return 'careless';
  }
  
  /**
   * 检查是否为运算符号错误
   */
  private isOperationError(question: Question, answer: number): boolean {
    if (question.operation === '+') {
      // 加法算成了减法
      return answer === question.a - question.b;
    } else {
      // 减法算成了加法
      return answer === question.a + question.b;
    }
  }
  
  /**
   * 检查是否为退位错误
   */
  private isBorrowError(question: Question, answer: number): boolean {
    if (question.operation !== '-') return false;
    
    const a = question.a;
    const b = question.b;
    const correctAnswer = a - b;
    const userAnswer = answer;
    
    // 检查个位借位处理
    const aOnes = a % 10;
    const bOnes = b % 10;
    
    if (aOnes < bOnes) {
      // 需要借位的情况
      // 如果用户答案的个位是 aOnes - bOnes（没有借位），则是退位错误
      const userOnes = Math.abs(userAnswer) % 10;
      const expectedOnes = (10 + aOnes - bOnes) % 10;
      
      return userOnes === (aOnes - bOnes) && userOnes !== expectedOnes;
    }
    
    return false;
  }
  
  /**
   * 检查是否为进位错误
   */
  private isCarryError(question: Question, answer: number): boolean {
    if (question.operation !== '+') return false;
    
    const a = question.a;
    const b = question.b;
    const correctAnswer = a + b;
    const userAnswer = answer;
    
    // 检查个位进位处理
    const aOnes = a % 10;
    const bOnes = b % 10;
    const sumOnes = aOnes + bOnes;
    
    if (sumOnes >= 10) {
      // 需要进位的情况
      const userOnes = Math.abs(userAnswer) % 10;
      const expectedOnes = sumOnes % 10;
      
      return userOnes !== expectedOnes;
    }
    
    return false;
  }
  
  /**
   * 获取错误类型的描述
   */
  getErrorDescription(errorType: ErrorType): string {
    const descriptions = {
      'borrow': '退位处理错误，个位不够减时需要向十位借1',
      'carry': '进位处理错误，个位相加满10时需要向十位进1',
      'careless': '计算错误，请仔细检查每一步',
      'timeout': '答题超时，请提高计算速度',
      'operation': '运算符号错误，请确认是加法还是减法'
    };
    
    return descriptions[errorType];
  }
  
  /**
   * 获取错误类型的建议
   */
  getErrorSuggestion(errorType: ErrorType): string {
    const suggestions = {
      'borrow': '练习退位减法：个位不够减时，从十位借1，个位加10再减',
      'carry': '练习进位加法：个位相加满10时，向十位进1，个位保留余数',
      'careless': '放慢速度，一步一步仔细计算',
      'timeout': '多练习提高计算速度，可以先求准确再求速度',
      'operation': '仔细读题，确认是加法还是减法'
    };
    
    return suggestions[errorType];
  }
}
