"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

/*
  Form primitives: glue between react-hook-form and our UI components.

  Why this file exists:
    react-hook-form manages form state (values, errors, submission).
    Our Input and Label components are visual only.
    Without this file we would manually wire htmlFor, id, aria-invalid,
    and aria-describedby on every form field. That is error prone and
    a screen reader accessibility risk.

    This file gives us composable parts (FormField, FormItem, FormLabel,
    FormControl, FormMessage) that handle all of that automatically.

  Composition pattern (used in RegisterForm and LoginForm):

    <Form {...form}>
      <FormField name="email" render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
    </Form>

  The wrapper components share IDs through React context, so the label,
  input, and error message all reference each other correctly without
  the developer having to wire them up.
*/

/*
  Form is just a re-export of FormProvider from react-hook-form.
  It makes the form's methods available to all FormField children
  via React context. We rename it to Form so the JSX reads clean.
*/
const Form = FormProvider;

/*
  FormFieldContext stores which field name this branch of the tree
  belongs to (e.g., "email", "password"). FormLabel and FormControl
  read this so they know which field's error to display.
*/
type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
);

/*
  FormField wraps react-hook-form's Controller. Controller is what
  connects an uncontrolled input (like our shadcn Input) to the
  form's state. We add a context provider around it so that nested
  FormLabel and FormControl can access the field name without
  receiving it as a prop on every level.
*/
const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

/*
  useFormField is the hook FormLabel, FormControl, and FormMessage
  call to learn about their field. It returns:
    - id           a unique ID for this FormItem (from React.useId)
    - name         the field name from FormFieldContext
    - formItemId   the id we put on the input
    - formMessageId  the id we put on the error message
    - error, isDirty, etc.  current state from react-hook-form

  These IDs are how aria-describedby and htmlFor get linked up
  automatically. Each form field gets a unique base ID via React.useId,
  so multiple instances of the same form on a page do not collide.
*/
const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

/*
  FormItemContext gives every FormItem its own unique ID, used as a
  prefix for the input ID, the description ID, and the error message
  ID inside that item.
*/
type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue,
);

/*
  FormItem is the wrapper around a single field's pieces (label, input,
  error). It generates a unique ID via React.useId and provides it to
  its children through context. Visually it stacks its children with
  a small gap.
*/
function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        data-slot="form-item"
        className={cn("grid gap-2", className)}
        {...props}
      />
    </FormItemContext.Provider>
  );
}

/*
  FormLabel renders our shadcn Label, but automatically:
    - sets htmlFor to the input ID (so clicking the label focuses the input)
    - turns red when the field has a validation error (data-error attribute)
*/
function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  const { error, formItemId } = useFormField();

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn("data-[error=true]:text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  );
}

/*
  FormControl wraps the actual input (or any control). Slot is a Radix
  pattern that "passes through" props to its only child without adding
  an extra DOM element. So we can attach ID, aria-invalid, and
  aria-describedby directly to the user's <Input /> without wrapping
  it in another <div>.

  aria-describedby points to both the description and the error message.
  Screen readers will announce them when the user focuses the input,
  so error messages are accessible without the user having to look
  at the screen.
*/
function FormControl({ ...props }: React.ComponentProps<typeof Slot>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  return (
    <Slot
      data-slot="form-control"
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
}

/*
  FormDescription is optional helper text under an input (e.g.,
  "Use 8 or more characters"). Linked to the input via aria-describedby
  so it is announced by screen readers.
*/
function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { formDescriptionId } = useFormField();

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

/*
  FormMessage shows the validation error for this field. When there is
  no error, it returns null and renders nothing. Linked to the input
  via aria-describedby (set in FormControl above) so screen readers
  announce the error when the user focuses the field.
*/
function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message ?? "") : props.children;

  if (!body) {
    return null;
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn("text-destructive text-sm", className)}
      {...props}
    >
      {body}
    </p>
  );
}

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};
