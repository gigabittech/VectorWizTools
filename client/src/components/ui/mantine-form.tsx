import { ReactNode, ReactElement } from 'react';
import { Controller, useFormContext, Control, FieldPath, FieldValues, ControllerRenderProps, ControllerFieldState, UseFormStateReturn } from 'react-hook-form';
import { Stack, Box, StackProps } from '@mantine/core';

// Form wrapper component - provides consistent spacing for form fields
interface MantineFormProps extends Omit<StackProps, 'children'> {
  children: ReactNode;
}

export function MantineForm({ children, gap = "md", ...props }: MantineFormProps) {
  return (
    <Stack gap={gap} {...props}>
      {children}
    </Stack>
  );
}

// Form field wrapper - integrates react-hook-form Controller with Mantine components
interface MantineFormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
  control?: Control<TFieldValues>;
  render: ({ field, fieldState }: {
    field: ControllerRenderProps<TFieldValues, TName>;
    fieldState: ControllerFieldState;
  }) => ReactElement;
}

export function MantineFormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({ name, control, render }: MantineFormFieldProps<TFieldValues, TName>) {
  const formContext = useFormContext<TFieldValues>();
  const formControl = control || formContext?.control;

  if (!formControl) {
    throw new Error('MantineFormField must be used within a form context or with control prop');
  }

  return (
    <Controller
      name={name}
      control={formControl}
      render={render}
    />
  );
}

// Form item wrapper - provides consistent spacing for individual form items
interface MantineFormItemProps {
  children: ReactNode;
  spacing?: string | number;
}

export function MantineFormItem({ children, spacing }: MantineFormItemProps) {
  return (
    <Box mb={spacing}>
      {children}
    </Box>
  );
}

// Hook for accessing form field state (similar to shadcn's useFormField)
export function useMantineFormField<TFieldValues extends FieldValues = FieldValues>(
  name: FieldPath<TFieldValues>
) {
  const { getFieldState, formState } = useFormContext<TFieldValues>();
  const fieldState = getFieldState(name, formState);
  
  return {
    name,
    error: fieldState.error,
    isValid: !fieldState.error,
    ...fieldState,
  };
}

// Utility type for form component props
export interface FormFieldRenderProps {
  field: {
    name: string;
    value: any;
    onChange: (value: any) => void;
    onBlur: () => void;
  };
  fieldState: {
    invalid: boolean;
    isTouched: boolean;
    isDirty: boolean;
    error?: {
      message?: string;
    };
  };
}

// Utility function to extract error message for Mantine components
export function getMantineError(fieldState: FormFieldRenderProps['fieldState']) {
  return fieldState.error?.message || null;
}

// Re-export common types for convenience
export type { Control, FieldPath, FieldValues } from 'react-hook-form';