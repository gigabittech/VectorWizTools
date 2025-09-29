# Mantine Migration Mapping Strategy

## Overview
This document outlines the mapping from shadcn/ui components to Mantine equivalents for the VectorWiz application. The migration will preserve all functionality while leveraging Mantine's built-in theming system.

## Component Priority Analysis

Based on usage frequency and critical path analysis, components are prioritized as follows:

### High Priority (Core UI - Migrate First)
These components are used throughout the application and should be migrated first:

1. **Button** → `@mantine/core` Button
2. **Card** → `@mantine/core` Paper/Card
3. **Input** → `@mantine/core` TextInput
4. **Label** → Built into Mantine inputs
5. **Avatar** → `@mantine/core` Avatar
6. **Badge** → `@mantine/core` Badge

### Medium Priority (Navigation & Layout)
These components are used in key layout areas:

7. **DropdownMenu** → `@mantine/core` Menu
8. **Select** → `@mantine/core` Select
9. **Textarea** → `@mantine/core` Textarea
10. **Progress** → `@mantine/core` Progress
11. **Dialog** → `@mantine/core` Modal
12. **Alert** → `@mantine/core` Alert

### Low Priority (Extended UI)
These components are used less frequently:

13. **Accordion** → `@mantine/core` Accordion
14. **Tabs** → `@mantine/core` Tabs
15. **Tooltip** → `@mantine/core` Tooltip
16. **Calendar** → `@mantine/dates` DatePicker
17. **Table** → `@mantine/core` Table

## Detailed Component Mapping

### Form Integration Components (Critical for React Hook Form)

#### Form → Mantine + React Hook Form Integration
```typescript
// Before (shadcn)
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";

const form = useForm();
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

// After (Mantine + Custom Wrapper)
import { useForm, Controller } from "react-hook-form";
import { TextInput, Stack } from '@mantine/core';

const form = useForm();
<form onSubmit={form.handleSubmit(onSubmit)}>
  <Controller
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
</form>
```

#### Alternative: Custom Mantine Form Wrappers
Create reusable form wrapper components that maintain the shadcn API but use Mantine internally:

```typescript
// Custom Mantine Form Components
import { useFormContext, Controller } from 'react-hook-form';
import { TextInput, Stack, Box } from '@mantine/core';

export const MantineForm = ({ children, ...props }) => (
  <Stack spacing="md" {...props}>{children}</Stack>
);

export const MantineFormField = ({ name, render, control }) => (
  <Controller name={name} control={control} render={render} />
);

export const MantineFormItem = ({ children }) => (
  <Box>{children}</Box>
);

// Usage matches shadcn pattern
<MantineForm>
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
</MantineForm>
```

#### Enhanced Pattern: Mantine Native Form Integration
```typescript
// Using Mantine's built-in form hooks (alternative approach)
import { useForm } from '@mantine/form';
import { TextInput, Button, Stack } from '@mantine/core';

const form = useForm({
  initialValues: { email: '', password: '' },
  validate: {
    email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
  },
});

<form onSubmit={form.onSubmit(onSubmit)}>
  <Stack spacing="md">
    <TextInput
      label="Email"
      placeholder="Email"
      {...form.getInputProps('email')}
    />
    <Button type="submit">Submit</Button>
  </Stack>
</form>
```

### 1. Button → Mantine Button
```typescript
// Before (shadcn)
import { Button } from "@/components/ui/button";
<Button variant="outline" size="sm">Click me</Button>

// After (Mantine)
import { Button } from '@mantine/core';
<Button variant="outline" size="sm">Click me</Button>
```

**Variant Mapping:**
- `default` → `filled`
- `destructive` → `filled` with `color="red"`
- `outline` → `outline` 
- `secondary` → `light`
- `ghost` → `subtle`
- `link` → `subtle` with underline styles

### 2. Card → Mantine Paper
```typescript
// Before (shadcn)
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// After (Mantine)
import { Paper, Title, Box } from '@mantine/core';
<Paper withBorder p="md">
  <Box mb="md">
    <Title order={3}>Title</Title>
  </Box>
  <Box>Content</Box>
</Paper>
```

### 3. Input → Mantine TextInput
```typescript
// Before (shadcn)
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" placeholder="Email" />

// After (Mantine)
import { TextInput } from '@mantine/core';
<TextInput 
  label="Email" 
  type="email" 
  placeholder="Email" 
/>
```

### 4. Avatar → Mantine Avatar
```typescript
// Before (shadcn)
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
<Avatar>
  <AvatarFallback>JD</AvatarFallback>
</Avatar>

// After (Mantine)
import { Avatar } from '@mantine/core';
<Avatar>JD</Avatar>
```

### 5. Badge → Mantine Badge
```typescript
// Before (shadcn)
import { Badge } from "@/components/ui/badge";
<Badge variant="secondary">Admin</Badge>

// After (Mantine)
import { Badge } from '@mantine/core';
<Badge variant="light">Admin</Badge>
```

### 6. DropdownMenu → Mantine Menu
```typescript
// Before (shadcn)
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
<DropdownMenu>
  <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Item 1</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

// After (Mantine)
import { Menu, Button } from '@mantine/core';
<Menu>
  <Menu.Target>
    <Button>Trigger</Button>
  </Menu.Target>
  <Menu.Dropdown>
    <Menu.Item>Item 1</Menu.Item>
  </Menu.Dropdown>
</Menu>
```

### 7. Select → Mantine Select
```typescript
// Before (shadcn)
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
  </SelectContent>
</Select>

// After (Mantine)
import { Select } from '@mantine/core';
<Select
  placeholder="Select option"
  data={[
    { value: 'option1', label: 'Option 1' }
  ]}
/>
```

### 8. Textarea → Mantine Textarea
```typescript
// Before (shadcn)
import { Textarea } from "@/components/ui/textarea";
<Textarea placeholder="Enter text" rows={4} />

// After (Mantine)
import { Textarea } from '@mantine/core';
<Textarea placeholder="Enter text" rows={4} />
```

### 9. Progress → Mantine Progress
```typescript
// Before (shadcn)
import { Progress } from "@/components/ui/progress";
<Progress value={75} />

// After (Mantine)
import { Progress } from '@mantine/core';
<Progress value={75} />
```

### 10. Dialog → Mantine Modal
```typescript
// Before (shadcn)
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
<Dialog open={opened}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    Content
  </DialogContent>
</Dialog>

// After (Mantine)
import { Modal, Title } from '@mantine/core';
<Modal opened={opened} onClose={close} title="Title">
  Content
</Modal>
```

### 11. Alert → Mantine Alert
```typescript
// Before (shadcn)
import { Alert, AlertDescription } from "@/components/ui/alert";
<Alert variant="destructive">
  <AlertDescription>Error message</AlertDescription>
</Alert>

// After (Mantine)
import { Alert } from '@mantine/core';
<Alert color="red">
  Error message
</Alert>
```

### End-to-End Example: LoginForm Migration

#### Before (Current LoginForm with shadcn)
```typescript
// LoginForm.tsx - Current Implementation
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginForm() {
  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome Back</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-destructive text-sm">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          <Button type="submit">Sign In</Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

#### After (Mantine Migration with react-hook-form)
```typescript
// LoginForm.tsx - Mantine Migration
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Paper, Title, TextInput, PasswordInput, Button, Stack, Box } from "@mantine/core";

export default function LoginForm() {
  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <Paper withBorder p="xl" radius="md" className="w-full max-w-md">
      <Box mb="lg">
        <Title order={2}>Welcome Back</Title>
      </Box>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Stack spacing="md">
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextInput
                label="Email"
                type="email"
                error={fieldState.error?.message}
                data-testid="email-input"
                {...field}
              />
            )}
          />
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <PasswordInput
                label="Password"
                error={fieldState.error?.message}
                data-testid="password-input"
                {...field}
              />
            )}
          />
          <Button type="submit" fullWidth>
            Sign In
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}
```

#### Alternative: Using Custom Form Wrappers
```typescript
// With custom form wrapper components for easier migration
import { MantineForm, MantineFormField } from "@/components/ui/mantine-form";

export default function LoginForm() {
  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <Paper withBorder p="xl" radius="md" className="w-full max-w-md">
      <Box mb="lg">
        <Title order={2}>Welcome Back</Title>
      </Box>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <MantineForm>
          <MantineFormField
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextInput
                label="Email"
                type="email"
                error={fieldState.error?.message}
                {...field}
              />
            )}
          />
          <MantineFormField
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <PasswordInput
                label="Password"
                error={fieldState.error?.message}
                {...field}
              />
            )}
          />
          <Button type="submit" fullWidth>Sign In</Button>
        </MantineForm>
      </form>
    </Paper>
  );
}
```

## Migration Strategy

### Phase 0: Form Foundation (Prerequisites)
**CRITICAL: Must be completed before any other form migrations**
1. Create Mantine form wrapper components (`MantineForm`, `MantineFormField`, etc.)
2. Create integration utilities for react-hook-form + Mantine
3. Test form wrapper components with a simple example
4. Document form migration patterns for the team

### Phase 1: Foundation (High Priority Components)
1. Create Mantine wrapper components for Button, Card, Input, Avatar, Badge
2. Migrate Navigation component (uses Button, Avatar, Badge, DropdownMenu)
3. Test navigation functionality across all pages

### Phase 2: Forms (Medium Priority Components)
1. Migrate form components (Select, Textarea, Progress)
2. Migrate GuestOrderForm component (major form implementation)
3. Migrate auth forms (LoginForm, SignupForm)
4. Test all form functionality and validation

### Phase 3: Layout & UI (Medium-Low Priority)
1. Migrate Dialog/Modal components
2. Migrate Alert/notification components
3. Migrate dashboard components
4. Test user workflows end-to-end

### Phase 4: Extended UI (Low Priority)
1. Migrate remaining complex components (Accordion, Tabs, Table, etc.)
2. Migrate page-specific components
3. Final cleanup and optimization

### Phase 5: Cleanup
1. Remove shadcn/ui dependencies
2. Remove unused component files
3. Update imports throughout codebase
4. Final testing and validation

## Key Considerations

### Theming Integration
- All Mantine components will automatically use the configured navy/green theme
- Custom styling can be applied via `styles` prop or CSS modules
- Dark mode switching will work automatically through the ColorSchemeProvider

### Form Integration
- Mantine has excellent form integration with `@mantine/form`
- Current react-hook-form usage should be preserved for consistency
- Labels are built into Mantine input components, simplifying markup

### Accessibility
- Mantine components come with built-in accessibility features
- Maintain existing data-testid attributes for testing
- Preserve keyboard navigation and screen reader support

### Performance
- Mantine uses CSS-in-JS but also supports CSS modules
- Tree shaking is supported for optimal bundle size
- Provider setup is already optimized for performance

## Risk Mitigation

### Breaking Changes
- Gradual migration minimizes risk of breaking existing functionality
- Each component should be tested in isolation before integration
- Fallback to shadcn components available during transition

### Visual Consistency
- Custom theme configuration matches existing design system
- CSS variable integration ensures color consistency
- Component-level styling can override defaults when needed

### TypeScript Integration
- Mantine has excellent TypeScript support
- Type definitions should be maintained throughout migration
- Interface compatibility should be preserved where possible