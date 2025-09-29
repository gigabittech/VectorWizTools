import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Paper, Title, TextInput, Button, Box } from '@mantine/core';
import { MantineForm, MantineFormField } from './mantine-form';

// Test schema for validation
const testSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type TestFormData = z.infer<typeof testSchema>;

// Test component to validate Mantine form wrapper functionality
export default function MantineFormTest() {
  const form = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  });

  const onSubmit = (data: TestFormData) => {
    console.log('Form submitted:', data);
    alert(`Form submitted! Name: ${data.name}, Email: ${data.email}`);
  };

  return (
    <Paper withBorder p="xl" radius="md" style={{ maxWidth: 500, margin: '2rem auto' }}>
      <Box mb="lg">
        <Title order={3}>Mantine Form Test</Title>
        <p style={{ color: 'var(--mantine-color-dimmed)' }}>
          Test the Mantine form wrapper components with validation
        </p>
      </Box>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <MantineForm>
          <MantineFormField
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextInput
                label="Name"
                placeholder="Enter your name"
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
                placeholder="Enter your email"
                error={fieldState.error?.message}
                data-testid="input-email"
                {...field}
              />
            )}
          />

          <MantineFormField
            name="message"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextInput
                label="Message"
                placeholder="Enter a message"
                error={fieldState.error?.message}
                data-testid="input-message"
                {...field}
              />
            )}
          />

          <Button 
            type="submit" 
            fullWidth 
            mt="md"
            data-testid="submit-button"
          >
            Submit Test Form
          </Button>
        </MantineForm>
      </form>

      <Box mt="md" style={{ fontSize: '0.875rem', color: 'var(--mantine-color-dimmed)' }}>
        <strong>Test Instructions:</strong>
        <ul style={{ margin: '0.5rem 0', paddingLeft: '1rem' }}>
          <li>Try submitting with empty fields to see validation errors</li>
          <li>Enter invalid email to test email validation</li>
          <li>Enter short message (&lt;10 chars) to test message validation</li>
          <li>Fill all fields correctly to test successful submission</li>
        </ul>
      </Box>
    </Paper>
  );
}