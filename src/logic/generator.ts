export interface Question {
  id: string;
  a: number;
  b: number;
  operation: '+' | '-' | '×' | '÷';
  hasBorrow: boolean;
  correctAnswer: number;
  displayText: string;
}

export interface Config {
  range: number; // 数值范围，如20表示20以内
  questionCount: number; // 题目数量
  borrowRatio: number; // 退位题目比例，0-1之间
  timeLimit: number; // 每题时间限制（秒）
}

export class QuestionGenerator {
  /**
   * 生成退位减法题目
   * 确保个位需要借位操作
   */
  generateBorrowSubtraction(range: number): Question {
    let a: number, b: number;
    let attempts = 0;
    
    do {
      // 生成被减数，确保个位小于减数的个位
      a = Math.floor(Math.random() * range) + 1;
      b = Math.floor(Math.random() * range) + 1;
      
      // 确保是减法且需要借位
      if (a < b) {
        [a, b] = [b, a]; // 交换，确保a > b
      }
      
      // 检查是否需要借位：个位相减时被减数小于减数
      const aOnes = a % 10;
      const bOnes = b % 10;
      
      attempts++;
    } while (aOnes >= bOnes && attempts < 50);
    
    // 如果尝试50次都没找到合适的题目，生成一个确定的退位题目
    if (attempts >= 50) {
      a = Math.floor(Math.random() * (range - 10)) + 11; // 11-20之间
      b = Math.floor(Math.random() * 9) + 1; // 1-9之间
      // 确保个位需要借位
      if (a % 10 < b % 10) {
        a = a - (a % 10) + (b % 10) + 1;
      }
    }
    
    const correctAnswer = a - b;
    const id = `sub_${a}_${b}_${Date.now()}`;
    
    return {
      id,
      a,
      b,
      operation: '-',
      hasBorrow: true,
      correctAnswer,
      displayText: `${a} - ${b} = ?`
    };
  }
  
  /**
   * 生成普通加法题目
   */
  generateAddition(range: number): Question {
    const a = Math.floor(Math.random() * range) + 1;
    const b = Math.floor(Math.random() * range) + 1;
    const correctAnswer = a + b;
    const id = `add_${a}_${b}_${Date.now()}`;
    
    return {
      id,
      a,
      b,
      operation: '+',
      hasBorrow: false,
      correctAnswer,
      displayText: `${a} + ${b} = ?`
    };
  }

  /**
   * 生成乘法题目
   */
  generateMultiplication(range: number): Question {
    // 对于乘法，限制乘数范围，避免结果过大
    const maxMultiplier = Math.min(12, Math.floor(Math.sqrt(range)));
    const a = Math.floor(Math.random() * maxMultiplier) + 1;
    const b = Math.floor(Math.random() * maxMultiplier) + 1;
    const correctAnswer = a * b;
    const id = `mul_${a}_${b}_${Date.now()}`;
    
    return {
      id,
      a,
      b,
      operation: '×',
      hasBorrow: false,
      correctAnswer,
      displayText: `${a} × ${b} = ?`
    };
  }

  /**
   * 生成除法题目
   */
  generateDivision(range: number): Question {
    // 生成一个乘积，然后分解为除数和商
    const maxMultiplier = Math.min(12, Math.floor(Math.sqrt(range)));
    const a = Math.floor(Math.random() * maxMultiplier) + 1;
    const b = Math.floor(Math.random() * maxMultiplier) + 1;
    const product = a * b;
    
    // 随机选择除数或商作为被除数
    const divisor = Math.random() < 0.5 ? a : b;
    const quotient = product / divisor;
    
    const id = `div_${product}_${divisor}_${Date.now()}`;
    
    return {
      id,
      a: product,
      b: divisor,
      operation: '÷',
      hasBorrow: false,
      correctAnswer: quotient,
      displayText: `${product} ÷ ${divisor} = ?`
    };
  }
  
  /**
   * 生成混合题目集合
   */
  generateMixedQuestions(config: Config, questionType: string): Question[] {
    const questions: Question[] = [];
    
    switch (questionType) {
      case 'borrow':
        // 全部退位减法
        for (let i = 0; i < config.questionCount; i++) {
          questions.push(this.generateBorrowSubtraction(config.range));
        }
        break;
        
      case 'carry':
        // 全部进位加法
        for (let i = 0; i < config.questionCount; i++) {
          questions.push(this.generateAddition(config.range));
        }
        break;
        
      case 'mixed':
        // 加减混合
        const borrowCount = Math.floor(config.questionCount * config.borrowRatio);
        const normalCount = config.questionCount - borrowCount;
        
        for (let i = 0; i < borrowCount; i++) {
          questions.push(this.generateBorrowSubtraction(config.range));
        }
        
        for (let i = 0; i < normalCount; i++) {
          questions.push(this.generateAddition(config.range));
        }
        break;
        
      case 'multiply':
        // 全部乘法
        for (let i = 0; i < config.questionCount; i++) {
          questions.push(this.generateMultiplication(config.range));
        }
        break;
        
      case 'divide':
        // 全部除法
        for (let i = 0; i < config.questionCount; i++) {
          questions.push(this.generateDivision(config.range));
        }
        break;
        
      case 'multiply_divide':
        // 乘除混合
        const multiplyCount = Math.floor(config.questionCount / 2);
        const divideCount = config.questionCount - multiplyCount;
        
        for (let i = 0; i < multiplyCount; i++) {
          questions.push(this.generateMultiplication(config.range));
        }
        
        for (let i = 0; i < divideCount; i++) {
          questions.push(this.generateDivision(config.range));
        }
        break;
        
      case 'all_four':
        // 四则混合
        const eachTypeCount = Math.floor(config.questionCount / 4);
        const remainder = config.questionCount % 4;
        
        // 加法
        for (let i = 0; i < eachTypeCount + (remainder > 0 ? 1 : 0); i++) {
          questions.push(this.generateAddition(config.range));
        }
        
        // 减法
        for (let i = 0; i < eachTypeCount + (remainder > 1 ? 1 : 0); i++) {
          questions.push(this.generateBorrowSubtraction(config.range));
        }
        
        // 乘法
        for (let i = 0; i < eachTypeCount + (remainder > 2 ? 1 : 0); i++) {
          questions.push(this.generateMultiplication(config.range));
        }
        
        // 除法
        for (let i = 0; i < eachTypeCount; i++) {
          questions.push(this.generateDivision(config.range));
        }
        break;
        
      default:
        // 默认退位减法
        for (let i = 0; i < config.questionCount; i++) {
          questions.push(this.generateBorrowSubtraction(config.range));
        }
    }
    
    // 打乱题目顺序
    return this.shuffleArray(questions);
  }
  
  /**
   * 打乱数组顺序
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  /**
   * 生成默认配置
   */
  getDefaultConfig(): Config {
    return {
      range: 20,
      questionCount: 10,
      borrowRatio: 0.7, // 70%退位题目
      timeLimit: 10
    };
  }
}


