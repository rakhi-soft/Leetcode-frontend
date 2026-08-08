import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Editor from '@monaco-editor/react';
import axiosClient from '../utils/axiosClient';
import { NavLink, useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Code2,
  FileText,
  FlaskConical,
  Save,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useTheme, useMonacoTheme, useThemedBorder } from '../context/ThemeContext';
import { FloatingInput, FloatingTextarea, FloatingSelect } from './FloatingField';
import Navbar from './Navbar';

const problemCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.enum(['array', 'linkedList', 'graph', 'dp']),
  visibleTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required'),
      explanation: z.string().min(1, 'Explanation is required'),
    })
  ).min(1, 'At least one visible test case required'),
  hiddenTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required'),
    })
  ).min(1, 'At least one hidden test case required'),
  startCode: z.array(
    z.object({
      language: z.enum(['C++', 'Java', 'JavaScript']),
      initialCode: z.string().min(1, 'Initial code is required'),
    })
  ).length(3, 'All three languages required'),
  referenceSolution: z.array(
    z.object({
      language: z.enum(['C++', 'Java', 'JavaScript']),
      completeCode: z.string().min(1, 'Complete code is required'),
    })
  ).length(3, 'All three languages required'),
});

const problemEditSchema = problemCreateSchema.extend({
  startCode: z.array(
    z.object({
      language: z.enum(['C++', 'Java', 'JavaScript']),
      initialCode: z.string(),
    })
  ).length(3, 'All three languages required'),
  referenceSolution: z.array(
    z.object({
      language: z.enum(['C++', 'Java', 'JavaScript']),
      completeCode: z.string(),
    })
  ).length(3, 'All three languages required'),
});

const sanitizeEditPayload = (data) => ({
  ...data,
  startCode: data.startCode.map((entry, index) => ({
    language: LANGUAGE_LABELS[index],
    initialCode: entry.initialCode?.trim() || '',
  })),
  referenceSolution: data.referenceSolution.map((entry, index) => ({
    language: LANGUAGE_LABELS[index],
    completeCode: entry.completeCode?.trim() || '',
  })),
});

const countFormErrors = (formErrors) => {
  let count = 0;
  const walk = (obj) => {
    Object.values(obj).forEach((value) => {
      if (value?.message) count += 1;
      else if (value && typeof value === 'object') walk(value);
    });
  };
  walk(formErrors);
  return count;
};

const formatFormErrors = (formErrors) => {
  const messages = [];
  const walk = (obj, path = '') => {
    Object.entries(obj).forEach(([key, value]) => {
      const nextPath = path ? `${path}.${key}` : key;
      if (value?.message) messages.push(`• ${nextPath}: ${value.message}`);
      else if (value && typeof value === 'object') walk(value, nextPath);
    });
  };
  walk(formErrors);
  return messages;
};

const LANGUAGE_TABS = [
  { id: 'cpp', label: 'C++', index: 0, monaco: 'cpp' },
  { id: 'java', label: 'Java', index: 1, monaco: 'java' },
  { id: 'javascript', label: 'JavaScript', index: 2, monaco: 'javascript' },
];

const DEFAULT_START_CODE = {
  0: 'class Solution {\npublic:\n    // your code here\n};',
  1: 'class Solution {\n    public void solve() {\n        // your code here\n    }\n}',
  2: 'function solution() {\n    // your code here\n}',
};

const LANGUAGE_LABELS = ['C++', 'Java', 'JavaScript'];

const normalizeLanguageLabel = (language) => {
  const value = language?.toLowerCase();
  if (value === 'c++' || value === 'cpp') return 'C++';
  if (value === 'java') return 'Java';
  if (value === 'javascript') return 'JavaScript';
  return language;
};

const mapCodeEntries = (entries, valueKey) =>
  LANGUAGE_LABELS.map((language, index) => {
    const match = entries?.find((entry) => normalizeLanguageLabel(entry.language) === language);
    const fallback = valueKey === 'initialCode' ? (DEFAULT_START_CODE[index] || '') : '';
    return {
      language,
      [valueKey]: match?.[valueKey] || fallback,
    };
  });

const emptyFormValues = {
  difficulty: 'easy',
  tags: 'array',
  visibleTestCases: [{ input: '', output: '', explanation: '' }],
  hiddenTestCases: [{ input: '', output: '' }],
  startCode: mapCodeEntries([], 'initialCode'),
  referenceSolution: LANGUAGE_LABELS.map((language) => ({ language, completeCode: '' })),
};

function AdminPanel() {
  const navigate = useNavigate();
  const { problemId } = useParams();
  const isEditMode = Boolean(problemId);
  const { theme } = useTheme();
  const monacoTheme = useMonacoTheme();
  const borders = useThemedBorder();
  const [activeLang, setActiveLang] = useState('javascript');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingProblem, setLoadingProblem] = useState(isEditMode);
  const [loadError, setLoadError] = useState(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEditMode ? problemEditSchema : problemCreateSchema),
    defaultValues: emptyFormValues,
  });

  const {
    fields: visibleFields,
    append: appendVisible,
    remove: removeVisible,
  } = useFieldArray({ control, name: 'visibleTestCases' });

  const {
    fields: hiddenFields,
    append: appendHidden,
    remove: removeHidden,
  } = useFieldArray({ control, name: 'hiddenTestCases' });

  const activeLangIndex = LANGUAGE_TABS.find((tab) => tab.id === activeLang)?.index ?? 2;
  const activeMonacoLang = LANGUAGE_TABS.find((tab) => tab.id === activeLang)?.monaco ?? 'javascript';

  useEffect(() => {
    if (!isEditMode) return;

    const fetchProblem = async () => {
      setLoadingProblem(true);
      setLoadError(null);
      try {
        const { data } = await axiosClient.get(`/problem/adminById/${problemId}`);
        reset({
          title: data.title,
          description: data.description,
          difficulty: data.difficulty?.toLowerCase(),
          tags: data.tags,
          visibleTestCases: data.visibleTestCases?.length
            ? data.visibleTestCases
            : [{ input: '', output: '', explanation: '' }],
          hiddenTestCases: data.hiddenTestCases?.length
            ? data.hiddenTestCases
            : [{ input: '', output: '' }],
          startCode: mapCodeEntries(data.startCode, 'initialCode'),
          referenceSolution: mapCodeEntries(data.referenceSolution, 'completeCode'),
        });
      } catch (error) {
        const message = error.response?.data || error.message || 'Failed to load problem';
        setLoadError(typeof message === 'string' ? message : 'Failed to load problem');
      } finally {
        setLoadingProblem(false);
      }
    };

    fetchProblem();
  }, [isEditMode, problemId, reset]);

  const onInvalid = (formErrors) => {
    const messages = formatFormErrors(formErrors);
    alert(
      messages.length
        ? `Please fix these errors before saving:\n\n${messages.slice(0, 8).join('\n')}`
        : 'Please fix validation errors before saving.'
    );
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    const payload = isEditMode ? sanitizeEditPayload(data) : data;
    try {
      if (isEditMode) {
        await axiosClient.put(`/problem/update/${problemId}`, payload);
        navigate('/admin/update');
      } else {
        await axiosClient.post('/problem/create', payload);
        navigate('/');
      }
    } catch (error) {
      const action = isEditMode ? 'update' : 'create';
      const message = error.response?.data || error.message || `Failed to ${action} problem`;
      alert(typeof message === 'string' ? message : `Failed to ${action} problem. Log out and log back in if you were recently made admin.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const errorCount = countFormErrors(errors);
  const errorMessages = formatFormErrors(errors);
  const formId = isEditMode ? 'edit-problem-form' : 'create-problem-form';

  if (loadingProblem) {
    return (
      <div className="min-h-screen bg-base-200 flex justify-center items-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center gap-4 px-4">
        <div className="alert alert-error max-w-md">
          <span>{loadError}</span>
        </div>
        <NavLink to="/admin/update" className="btn btn-ghost">Back to Update</NavLink>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />
      <nav className={`navbar bg-base-100 border-b px-4 sticky top-14 z-20 transition-colors duration-200 ${borders.divider}`}>
        <div className="flex-1 gap-2">
          <NavLink to="/admin" className="btn btn-ghost btn-sm gap-2">
            <ArrowLeft size={16} />
            Admin
          </NavLink>
          <span className="text-base-content/40">/</span>
          {isEditMode ? (
            <>
              <NavLink to="/admin/update" className="link link-hover text-sm">Update</NavLink>
              <span className="text-base-content/40">/</span>
              <span className="font-semibold">Edit Problem</span>
            </>
          ) : (
            <span className="font-semibold">Create Problem</span>
          )}
        </div>
        <button
          type="submit"
          form={formId}
          className={`btn btn-primary btn-sm gap-2 ${isSubmitting ? 'loading' : ''}`}
          disabled={isSubmitting}
        >
          <Save size={16} />
          {isEditMode ? 'Save Changes' : 'Publish Problem'}
        </button>
      </nav>

      <div className="container mx-auto max-w-5xl px-4 py-8 pb-28">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditMode ? 'Edit Problem' : 'Create New Problem'}
          </h1>
          <p className="text-base-content/60 mt-2">
            {isEditMode
              ? 'Update the problem details, test cases, and code templates.'
              : 'Add a coding challenge with test cases and solutions in C++, Java, and JavaScript.'}
          </p>
        </div>

        {errorCount > 0 && (
          <div className="alert alert-error mb-6 shadow-sm">
            <div>
              <p className="font-medium">Please fix {errorCount} error(s) before saving:</p>
              <ul className="mt-2 text-sm list-disc list-inside space-y-1">
                {errorMessages.slice(0, 6).map((msg) => (
                  <li key={msg}>{msg.replace(/^•\s*/, '')}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <form id={formId} onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
          {/* Basic Information */}
          <section className={`card bg-base-100 shadow-md border transition-colors duration-200 ${borders.card}`}>
            <div className="card-body gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="card-title text-lg">Basic Information</h2>
                  <p className="text-sm text-base-content/60">Title, description, and metadata</p>
                </div>
              </div>

              <div className="grid gap-5">
                <FloatingInput
                  label="Problem Title"
                  required
                  placeholder="e.g. Two Sum"
                  error={errors.title?.message}
                  {...register('title')}
                />

                <FloatingTextarea
                  label="Description"
                  required
                  rows={8}
                  inputClassName="min-h-[12rem]"
                  placeholder="Describe the problem, constraints, and expected behavior..."
                  error={errors.description?.message}
                  {...register('description')}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FloatingSelect label="Difficulty" required {...register('difficulty')}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </FloatingSelect>

                  <FloatingSelect label="Topic Tag" required {...register('tags')}>
                    <option value="array">Array</option>
                    <option value="linkedList">Linked List</option>
                    <option value="graph">Graph</option>
                    <option value="dp">Dynamic Programming</option>
                  </FloatingSelect>
                </div>
              </div>
            </div>
          </section>

          {/* Test Cases */}
          <section className={`card bg-base-100 shadow-md border transition-colors duration-200 ${borders.card}`}>
            <div className="card-body gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                  <FlaskConical size={20} />
                </div>
                <div>
                  <h2 className="card-title text-lg">Test Cases</h2>
                  <p className="text-sm text-base-content/60">Visible examples and hidden evaluation cases</p>
                </div>
              </div>

              {/* Visible */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Eye size={18} className="text-success" />
                    <h3 className="font-semibold">Visible Test Cases</h3>
                    <span className="badge badge-ghost badge-sm">{visibleFields.length}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => appendVisible({ input: '', output: '', explanation: '' })}
                    className="btn btn-sm btn-outline btn-primary gap-1"
                  >
                    <Plus size={14} />
                    Add Case
                  </button>
                </div>

                {visibleFields.length === 0 && (
                  <div className={`rounded-xl border border-dashed p-6 text-center text-base-content/50 text-sm transition-colors duration-200 ${borders.field}`}>
                    No visible test cases yet. Add at least one example users can see.
                  </div>
                )}

                {visibleFields.map((field, index) => (
                  <div key={field.id} className={`rounded-xl border bg-base-100 p-5 space-y-4 transition-colors duration-200 ${borders.card}`}>
                    <div className="flex items-center justify-between">
                      <span className="badge badge-outline">Example {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeVisible(index)}
                        className="btn btn-ghost btn-xs text-error gap-1"
                        disabled={visibleFields.length === 1}
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FloatingTextarea
                        label="Input"
                        required
                        rows={4}
                        placeholder="[2,7,11,15]&#10;9"
                        inputClassName="font-mono text-sm min-h-[6rem]"
                        {...register(`visibleTestCases.${index}.input`)}
                      />
                      <FloatingTextarea
                        label="Expected Output"
                        required
                        rows={4}
                        placeholder="[0,1]"
                        inputClassName="font-mono text-sm min-h-[6rem]"
                        {...register(`visibleTestCases.${index}.output`)}
                      />
                    </div>
                    <FloatingInput
                      label="Explanation"
                      required
                      placeholder="Because nums[0] + nums[1] == target..."
                      {...register(`visibleTestCases.${index}.explanation`)}
                    />
                  </div>
                ))}
              </div>

              <div className="divider my-2" />

              {/* Hidden */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <EyeOff size={18} className="text-warning" />
                    <h3 className="font-semibold">Hidden Test Cases</h3>
                    <span className="badge badge-ghost badge-sm">{hiddenFields.length}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => appendHidden({ input: '', output: '' })}
                    className="btn btn-sm btn-outline btn-primary gap-1"
                  >
                    <Plus size={14} />
                    Add Case
                  </button>
                </div>

                {hiddenFields.map((field, index) => (
                  <div key={field.id} className={`rounded-xl border bg-base-100 p-5 space-y-4 transition-colors duration-200 ${borders.card}`}>
                    <div className="flex items-center justify-between">
                      <span className="badge badge-outline badge-warning">Hidden {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeHidden(index)}
                        className="btn btn-ghost btn-xs text-error gap-1"
                        disabled={hiddenFields.length === 1}
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FloatingTextarea
                        label="Input"
                        required
                        rows={4}
                        inputClassName="font-mono text-sm min-h-[6rem]"
                        {...register(`hiddenTestCases.${index}.input`)}
                      />
                      <FloatingTextarea
                        label="Expected Output"
                        required
                        rows={4}
                        inputClassName="font-mono text-sm min-h-[6rem]"
                        {...register(`hiddenTestCases.${index}.output`)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Code Templates */}
          <section className={`card bg-base-100 shadow-md border overflow-hidden transition-colors duration-200 ${borders.card}`}>
            <div className="card-body gap-0 p-0">
              <div className={`p-6 pb-4 flex items-center gap-3 border-b transition-colors duration-200 ${borders.divider}`}>
                <div className="p-2 rounded-lg bg-accent/10 text-accent">
                  <Code2 size={20} />
                </div>
                <div>
                  <h2 className="card-title text-lg">Code Templates</h2>
                  <p className="text-sm text-base-content/60">Starter code and reference solutions per language</p>
                </div>
              </div>

              <div className="tabs tabs-bordered px-6 pt-2 bg-base-200/50">
                {LANGUAGE_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`tab tab-lg ${activeLang === tab.id ? 'tab-active font-semibold' : ''}`}
                    onClick={() => setActiveLang(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6 space-y-6">
                {LANGUAGE_LABELS.map((language, index) => (
                  <input
                    key={`start-lang-${language}`}
                    type="hidden"
                    {...register(`startCode.${index}.language`)}
                    defaultValue={language}
                  />
                ))}
                {LANGUAGE_LABELS.map((language, index) => (
                  <input
                    key={`ref-lang-${language}`}
                    type="hidden"
                    {...register(`referenceSolution.${index}.language`)}
                    defaultValue={language}
                  />
                ))}

                <fieldset className={`rounded-xl border bg-base-100 px-4 pt-1 pb-3 transition-colors duration-200 ${borders.field}`}>
                  <legend className="px-1 text-sm font-medium text-base-content/80">
                    Starter Code
                    <span className="text-base-content/50 font-normal ml-1">· shown to users</span>
                  </legend>
                  <div className={`rounded-lg overflow-hidden border transition-colors duration-200 ${theme === 'light' ? 'bg-[#1e1e1e] border-[#3c3c3c]' : 'bg-[#fffffe] border-white/30 hover:border-white/45'}`}>
                    <Controller
                      name={`startCode.${activeLangIndex}.initialCode`}
                      control={control}
                      render={({ field }) => (
                        <Editor
                          key={`start-${monacoTheme}`}
                          height="220px"
                          language={activeMonacoLang}
                          value={field.value}
                          onChange={(value) => field.onChange(value || '')}
                          theme={monacoTheme}
                          options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            alwaysConsumeMouseWheel: false,
                          }}
                        />
                      )}
                    />
                  </div>
                </fieldset>

                <fieldset className={`rounded-xl border bg-base-100 px-4 pt-1 pb-3 transition-colors duration-200 ${borders.field}`}>
                  <legend className="px-1 text-sm font-medium text-base-content/80">
                    Reference Solution
                    <span className="text-base-content/50 font-normal ml-1">· must pass all tests</span>
                  </legend>
                  <div className={`rounded-lg overflow-hidden border transition-colors duration-200 ${theme === 'light' ? 'bg-[#1e1e1e] border-[#3c3c3c]' : 'bg-[#fffffe] border-white/30 hover:border-white/45'}`}>
                    <Controller
                      name={`referenceSolution.${activeLangIndex}.completeCode`}
                      control={control}
                      render={({ field }) => (
                        <Editor
                          key={`ref-${monacoTheme}`}
                          height="280px"
                          language={activeMonacoLang}
                          value={field.value}
                          onChange={(value) => field.onChange(value || '')}
                          theme={monacoTheme}
                          options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            alwaysConsumeMouseWheel: false,
                          }}
                        />
                      )}
                    />
                  </div>
                </fieldset>
              </div>
            </div>
          </section>

          <div className="flex flex-col sm:flex-row gap-3 pb-12 scroll-mt-8">
            <NavLink to={isEditMode ? '/admin/update' : '/admin'} className="btn btn-ghost flex-1">Cancel</NavLink>
            <button
              type="submit"
              className={`btn btn-primary flex-[2] gap-2 ${isSubmitting ? 'loading' : ''}`}
              disabled={isSubmitting}
            >
              <Save size={18} />
              {isEditMode ? 'Save Changes' : 'Create Problem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminPanel;
