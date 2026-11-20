import { z } from 'zod';
// Exemple de schema reutilisable avec zodResolver et React Hook Form.
export const exampleFormSchema = z.object({ name: z.string().min(2) });
