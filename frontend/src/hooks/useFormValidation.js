import { useState, useCallback } from "react";

/**
 * Custom hook for form validation with real-time feedback
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationRules - Validation rules object
 * @returns {Object} Validation state and methods
 */
export const useFormValidation = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = useCallback(
    (name, value) => {
      const rules = validationRules[name];
      if (!rules) return "";

      for (const rule of rules) {
        if (rule.required && (!value || value.trim() === "")) {
          return rule.message || `${name} is required`;
        }
        if (rule.min && value && value.length < rule.min) {
          return rule.message || `${name} must be at least ${rule.min} characters`;
        }
        if (rule.max && value && value.length > rule.max) {
          return rule.message || `${name} must be at most ${rule.max} characters`;
        }
        if (rule.pattern && value && !rule.pattern.test(value)) {
          return rule.message || `${name} format is invalid`;
        }
        if (rule.minValue && value && parseFloat(value) < rule.minValue) {
          return rule.message || `${name} must be at least ${rule.minValue}`;
        }
        if (rule.maxValue && value && parseFloat(value) > rule.maxValue) {
          return rule.message || `${name} must be at most ${rule.maxValue}`;
        }
        if (rule.custom && value) {
          const customError = rule.custom(value);
          if (customError) return customError;
        }
      }
      return "";
    },
    [validationRules]
  );

  const validateAll = useCallback(() => {
    const newErrors = {};
    Object.keys(validationRules).forEach((name) => {
      const error = validateField(name, values[name]);
      if (error) newErrors[name] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values, validateField, validationRules]);

  const handleChange = useCallback(
    (name, value) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      if (touched[name]) {
        const error = validateField(name, value);
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [touched, validateField]
  );

  const handleBlur = useCallback(
    (name) => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      const error = validateField(name, values[name]);
      setErrors((prev) => ({ ...prev, [name]: error }));
    },
    [values, validateField]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    setValues,
  };
};

export default useFormValidation;


