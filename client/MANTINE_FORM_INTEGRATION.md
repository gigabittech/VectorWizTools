# Mantine Form Integration Guide

## Overview
This document provides guidance on using the Mantine form wrapper components for seamless integration with react-hook-form validation in the VectorWiz application.

## Core Components

### MantineForm
A wrapper component that provides consistent spacing for form fields using Mantine's Stack component.

```typescript
import { MantineForm } from '@/components/ui/mantine-form';

<MantineForm gap="md">
  {/* Form fields go here */}
</MantineForm>
```

### MantineFormField
A wrapper around react-hook-form's Controller that integrates with Mantine input components.

```typescript
import { MantineFormField } from '@/components/ui/mantine-form';

<MantineFormField
  name="email"
  control={form.control}
  render={({ field, fieldState }) => (
    <TextInput
      label="Email"
      error={fieldState.error?.message}
      {...field}
    />
  )}
/>
```

### MantineFormItem
A container component for individual form items with consistent spacing.

```typescript
import { MantineFormItem } from '@/components/ui/mantine-form';

<MantineFormItem>
  {/* Individual form field */}
</MantineFormItem>
```

## Usage Patterns

### Basic Form Implementation
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextInput, Button } from '@mantine/core';
import { MantineForm, MantineFormField } from '@/components/ui/mantine-form';

export default function MyForm() {
  const form = useForm({
    resolver: zodResolver(mySchema),
    defaultValues: { email: '', name: '' },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <MantineForm>
        <MantineFormField
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <TextInput
              label="Name"
              error={fieldState.error?.message}
              data-testid="input-name"
              {...field}
            />
          )}
        />
        
        <MantineFormField
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <TextInput
              label="Email"
              type="email"
              error={fieldState.error?.message}
              data-testid="input-email"
              {...field}
            />
          )}
        />
        
        <Button type="submit">Submit</Button>
      </MantineForm>
    </form>
  );
}
```

### Advanced Form Integration
```typescript
// For complex forms with multiple input types
<MantineForm>
  <MantineFormField
    name="service"
    control={form.control}
    render={({ field, fieldState }) => (
      <Select
        label="Service Type"
        data={serviceOptions}
        error={fieldState.error?.message}
        {...field}
      />
    )}
  />
  
  <MantineFormField
    name="description"
    control={form.control}
    render={({ field, fieldState }) => (
      <Textarea
        label="Description"
        rows={4}
        error={fieldState.error?.message}
        {...field}
      />
    )}
  />
  
  <MantineFormField
    name="urgent"
    control={form.control}
    render={({ field }) => (
      <Checkbox
        label="Urgent Request"
        checked={field.value}
        onChange={field.onChange}
      />
    )}
  />
</MantineForm>
```

## Migration from shadcn Forms

### Before (shadcn)
```typescript
<Form {...form}>
  <FormField
    control={form.control}
    name="email"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input placeholder="Email" {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</Form>
```

### After (Mantine)
```typescript
<form onSubmit={form.handleSubmit(onSubmit)}>
  <MantineForm>
    <MantineFormField
      name="email"
      control={form.control}
      render={({ field, fieldState }) => (
        <TextInput
          label="Email"
          placeholder="Email"
          error={fieldState.error?.message}
          {...field}
        />
      )}
    />
  </MantineForm>
</form>
```

## Key Benefits

1. **Seamless Integration**: Works perfectly with existing react-hook-form setup
2. **Built-in Validation**: Error messages integrate with Mantine's error styling
3. **Consistent Theming**: Automatically uses the configured navy/green theme
4. **Accessibility**: Mantine components include built-in accessibility features
5. **TypeScript Support**: Full type safety with proper field and state typing

## Testing Guidelines

All form components should include:
- `data-testid` attributes for automated testing
- Proper error message validation
- Form submission testing
- Field-level validation testing

Example test structure:
```typescript
// Test empty form validation
await page.click('[data-testid="submit-button"]');
await expect(page.locator('text=This field is required')).toBeVisible();

// Test successful submission
await page.fill('[data-testid="input-email"]', 'test@example.com');
await page.click('[data-testid="submit-button"]');
await expect(page.locator('text=Success')).toBeVisible();
```

## Next Steps

With the form foundation in place, you can now:
1. Migrate existing forms (LoginForm, SignupForm, GuestOrderForm)
2. Use these patterns for new form implementations
3. Gradually replace shadcn form components throughout the application

## Validation

✅ Form wrapper components created and tested
✅ React-hook-form integration working
✅ Mantine theme integration confirmed
✅ Error handling and validation working
✅ TypeScript types properly defined
✅ Test coverage validated with automated testing