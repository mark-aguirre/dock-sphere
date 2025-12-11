import * as React from "react"
import { Check, AlertCircle, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

interface BaseFieldProps {
  label: string
  description?: string
  error?: string
  required?: boolean
  className?: string
  success?: boolean
}

interface TextFieldProps extends BaseFieldProps {
  type?: "text" | "email" | "url" | "number"
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  autoComplete?: string
  maxLength?: number
  pattern?: string
}

interface PasswordFieldProps extends Omit<TextFieldProps, "type"> {
  showStrength?: boolean
}

interface TextareaFieldProps extends BaseFieldProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  rows?: number
  maxLength?: number
}

interface SelectFieldProps extends BaseFieldProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string; disabled?: boolean }>
  disabled?: boolean
}

// Base field wrapper
function FieldWrapper({ 
  label, 
  description, 
  error, 
  success, 
  required, 
  className, 
  children 
}: BaseFieldProps & { children: React.ReactNode }) {
  const fieldId = React.useId()
  
  return (
    <div className={cn("space-y-2", className)}>
      <Label 
        htmlFor={fieldId} 
        className={cn(
          "text-sm font-medium",
          error && "text-destructive",
          success && "text-green-600"
        )}
      >
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      <div className="relative">
        {React.cloneElement(children as React.ReactElement, { 
          id: fieldId,
          'aria-describedby': description || error ? `${fieldId}-description` : undefined,
          'aria-invalid': !!error
        })}
        
        {(success || error) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {success && <Check className="h-4 w-4 text-green-600" />}
            {error && <AlertCircle className="h-4 w-4 text-destructive" />}
          </div>
        )}
      </div>
      
      {(description || error) && (
        <p 
          id={`${fieldId}-description`}
          className={cn(
            "text-sm",
            error ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {error || description}
        </p>
      )}
    </div>
  )
}

// Text field with validation states
export function TextField(props: TextFieldProps) {
  const { label, description, error, success, required, className, ...inputProps } = props
  
  return (
    <FieldWrapper
      label={label}
      description={description}
      error={error}
      success={success}
      required={required}
      className={className}
    >
      <Input
        {...inputProps}
        onChange={(e) => inputProps.onChange(e.target.value)}
        className={cn(
          error && "border-destructive focus-visible:ring-destructive",
          success && "border-green-600 focus-visible:ring-green-600",
          (success || error) && "pr-10"
        )}
      />
    </FieldWrapper>
  )
}

// Password field with show/hide toggle
export function PasswordField({ showStrength = false, ...props }: PasswordFieldProps) {
  const [showPassword, setShowPassword] = React.useState(false)
  const [strength, setStrength] = React.useState(0)
  
  const calculateStrength = (password: string) => {
    let score = 0
    if (password.length >= 8) score++
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  }
  
  React.useEffect(() => {
    if (showStrength) {
      setStrength(calculateStrength(props.value))
    }
  }, [props.value, showStrength])
  
  const strengthColors = [
    "bg-red-500",
    "bg-orange-500", 
    "bg-yellow-500",
    "bg-blue-500",
    "bg-green-500"
  ]
  
  const strengthLabels = [
    "Very Weak",
    "Weak", 
    "Fair",
    "Good",
    "Strong"
  ]

  return (
    <div className="space-y-2">
      <FieldWrapper
        label={props.label}
        description={props.description}
        error={props.error}
        success={props.success}
        required={props.required}
        className={props.className}
      >
        <div className="relative">
          <Input
            {...props}
            type={showPassword ? "text" : "password"}
            onChange={(e) => props.onChange(e.target.value)}
            className={cn(
              props.error && "border-destructive focus-visible:ring-destructive",
              props.success && "border-green-600 focus-visible:ring-green-600",
              "pr-20"
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </FieldWrapper>
      
      {showStrength && props.value && (
        <div className="space-y-2">
          <div className="flex space-x-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 flex-1 rounded-full transition-colors",
                  i < strength ? strengthColors[strength - 1] : "bg-muted"
                )}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Password strength: {strengthLabels[strength - 1] || "Very Weak"}
          </p>
        </div>
      )}
    </div>
  )
}

// Textarea field
export function TextareaField(props: TextareaFieldProps) {
  const { label, description, error, success, required, className, maxLength, ...textareaProps } = props
  
  return (
    <div className="space-y-2">
      <FieldWrapper
        label={label}
        description={description}
        error={error}
        success={success}
        required={required}
        className={className}
      >
        <Textarea
          {...textareaProps}
          maxLength={maxLength}
          onChange={(e) => textareaProps.onChange(e.target.value)}
          className={cn(
            error && "border-destructive focus-visible:ring-destructive",
            success && "border-green-600 focus-visible:ring-green-600"
          )}
        />
      </FieldWrapper>
      
      {maxLength && (
        <div className="flex justify-end">
          <span className="text-xs text-muted-foreground">
            {props.value.length}/{maxLength}
          </span>
        </div>
      )}
    </div>
  )
}

// Select field
export function SelectField(props: SelectFieldProps) {
  const { label, description, error, success, required, className, ...selectProps } = props
  
  return (
    <FieldWrapper
      label={label}
      description={description}
      error={error}
      success={success}
      required={required}
      className={className}
    >
      <Select
        value={selectProps.value}
        onValueChange={selectProps.onChange}
        disabled={selectProps.disabled}
      >
        <SelectTrigger
          className={cn(
            error && "border-destructive focus:ring-destructive",
            success && "border-green-600 focus:ring-green-600"
          )}
        >
          <SelectValue placeholder={selectProps.placeholder} />
        </SelectTrigger>
        <SelectContent>
          {selectProps.options.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldWrapper>
  )
}