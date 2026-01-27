# AI Agent Task: Optimize Forms with TanStack React Query

## Objective
Refactor all submit forms and edit/update forms in the codebase to use TanStack React Query for optimized state management and guaranteed data consistency.

## Requirements

### 1. Form Submission Optimization
- Replace all manual form submission handlers with `useMutation` from TanStack React Query
- Implement proper loading, error, and success states
- Add optimistic updates where appropriate
- Ensure proper error handling and user feedback

### 2. Data Fetching for Edit Forms
- Use `useQuery` to fetch existing data for edit forms
- Implement proper loading skeletons while data is being fetched
- Handle empty states and errors gracefully
- Cache form data appropriately

### 3. Required Implementation Pattern

For **Submit Forms** (Create):
```javascript
import { useMutation, useQueryClient } from '@tanstack/react-query';

const CreateForm = () => {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: (formData) => api.create(formData),
    onSuccess: (data) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['items'] });
      // Show success message
      // Reset form or redirect
    },
    onError: (error) => {
      // Handle error state
      // Show error message
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button 
        type="submit" 
        disabled={mutation.isPending}
      >
        {mutation.isPending ? 'Submitting...' : 'Submit'}
      </button>
      {mutation.isError && <Error message={mutation.error.message} />}
    </form>
  );
};
```

For **Edit/Update Forms**:
```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const EditForm = ({ id }) => {
  const queryClient = useQueryClient();
  
  // Fetch existing data
  const { data, isLoading, error } = useQuery({
    queryKey: ['item', id],
    queryFn: () => api.getById(id),
    enabled: !!id
  });

  // Update mutation
  const mutation = useMutation({
    mutationFn: (formData) => api.update(id, formData),
    onMutate: async (newData) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['item', id] });
      const previousData = queryClient.getQueryData(['item', id]);
      queryClient.setQueryData(['item', id], newData);
      return { previousData };
    },
    onError: (err, newData, context) => {
      // Rollback on error
      queryClient.setQueryData(['item', id], context.previousData);
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['item', id] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    }
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <Error message={error.message} />;

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields pre-filled with data */}
      <button 
        type="submit" 
        disabled={mutation.isPending}
      >
        {mutation.isPending ? 'Updating...' : 'Update'}
      </button>
    </form>
  );
};
```

### 4. Key Features to Implement

**For All Forms:**
- ✅ Loading states (`isPending`, `isLoading`)
- ✅ Error handling (`isError`, `error`)
- ✅ Success states (`isSuccess`)
- ✅ Disable submit button during pending state
- ✅ Clear error/success messages
- ✅ Form reset after successful submission (where appropriate)

**For Edit Forms Specifically:**
- ✅ Optimistic updates for better UX
- ✅ Automatic rollback on error
- ✅ Query invalidation after update
- ✅ Pre-fill form fields with fetched data
- ✅ Loading skeleton while fetching data

**Cache Management:**
- ✅ Invalidate related queries after mutations
- ✅ Set appropriate `staleTime` and `cacheTime`
- ✅ Use query keys consistently across the app

### 5. Error Handling Strategy
- Display user-friendly error messages
- Log errors for debugging
- Provide retry mechanisms where appropriate
- Handle network errors gracefully
- Validate data before submission

### 6. Success Handling
- Show success notifications/toasts
- Redirect user after successful submission (if applicable)
- Reset form state after successful creation
- Update UI immediately with optimistic updates

### 7. Additional Optimizations
- Implement debouncing for auto-save features
- Add form validation before mutation
- Use `queryClient.setQueryData` for optimistic updates
- Implement proper TypeScript types for mutations and queries
- Add retry logic for failed mutations where appropriate

## Scan Instructions for AI Agent

1. **Locate all forms** in the codebase that handle:
   - Create operations (POST requests)
   - Update operations (PUT/PATCH requests)
   - Any form submissions that modify data

2. **Identify forms that need refactoring:**
   - Forms using `useState` for loading/error states
   - Forms using `useEffect` for data fetching
   - Forms with manual API calls in event handlers
   - Forms without proper loading/error states

3. **For each form, implement:**
   - TanStack React Query setup
   - Proper mutation hooks
   - Query hooks for edit forms
   - Loading/error/success UI states
   - Cache invalidation strategy

4. **Ensure consistency:**
   - Use consistent query key naming conventions
   - Apply the same error handling pattern across all forms
   - Standardize success feedback mechanisms
   - Maintain consistent button states and labels

## Expected Outcome

After optimization:
- All forms use TanStack React Query for state management
- Guaranteed data consistency through proper cache invalidation
- Optimistic updates for better user experience
- Proper error handling and recovery
- Improved loading states and user feedback
- Reduced boilerplate code
- Better TypeScript support and type safety

## Testing Checklist

For each refactored form, verify:
- [ ] Form submits successfully
- [ ] Loading state displays correctly
- [ ] Error states are handled and displayed
- [ ] Success feedback is shown
- [ ] Data is properly cached and invalidated
- [ ] Optimistic updates work (for edit forms)
- [ ] Network errors are handled gracefully
- [ ] Form resets/redirects after success (where appropriate)