// 表單驗證工具

// 驗證規則
export const validationRules = {
  required: (value) => {
    if (typeof value === 'string') return value.trim().length > 0;
    return value !== null && value !== undefined;
  },
  
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },
  
  minLength: (min) => (value) => {
    return typeof value === 'string' && value.length >= min;
  },
  
  maxLength: (max) => (value) => {
    return typeof value === 'string' && value.length <= max;
  },
  
  password: (value) => {
    // 至少 8 字符，包含大小寫字母和數字
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(value);
  },
  
  phone: (value) => {
    // 台灣手機號碼格式
    const phoneRegex = /^09\d{8}$/;
    return phoneRegex.test(value);
  },
  
  url: (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }
};

// 驗證函數
export const validate = (value, rules) => {
  const errors = [];
  
  for (const rule of rules) {
    if (typeof rule === 'function') {
      if (!rule(value)) {
        errors.push(rule.message || '驗證失敗');
      }
    } else if (typeof rule === 'object') {
      const { validator, message } = rule;
      if (!validator(value)) {
        errors.push(message || '驗證失敗');
      }
    }
  }
  
  return errors;
};

// 表單驗證器
export class FormValidator {
  constructor(schema) {
    this.schema = schema;
  }
  
  validate(data) {
    const errors = {};
    let isValid = true;
    
    for (const [field, rules] of Object.entries(this.schema)) {
      const fieldErrors = validate(data[field], rules);
      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors[0]; // 只返回第一個錯誤
        isValid = false;
      }
    }
    
    return { isValid, errors };
  }
}

// 常用的驗證模式
export const commonValidators = {
  name: [
    { validator: validationRules.required, message: '請輸入姓名' },
    { validator: validationRules.minLength(2), message: '姓名至少需要2個字符' },
    { validator: validationRules.maxLength(50), message: '姓名不能超過50個字符' }
  ],
  
  email: [
    { validator: validationRules.required, message: '請輸入電子郵件' },
    { validator: validationRules.email, message: '請輸入有效的電子郵件格式' }
  ],
  
  password: [
    { validator: validationRules.required, message: '請輸入密碼' },
    { validator: validationRules.minLength(8), message: '密碼至少需要8個字符' }
  ],
  
  phone: [
    { validator: validationRules.required, message: '請輸入手機號碼' },
    { validator: validationRules.phone, message: '請輸入有效的手機號碼格式（09xxxxxxxx）' }
  ]
};
