import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import axiosClient from '../utils/axiosClient';
import { ArrowLeft, Edit } from 'lucide-react';
import { useThemedBorder } from '../context/ThemeContext';
import Navbar from './Navbar';

const difficultyBadge = (difficulty) => {
  const value = difficulty?.toLowerCase();
  if (value === 'easy') return 'badge-success';
  if (value === 'medium') return 'badge-warning';
  return 'badge-error';
};

function AdminUpdate() {
  const borders = useThemedBorder();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);
        const { data } = await axiosClient.get('/problem/getAllProblem');
        setProblems(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch problems');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex justify-center items-center">
        <span className="loading loading-spinner loading-lg"></span>
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
          <span className="font-semibold">Update Problem</span>
        </div>
      </nav>

      <div className="container mx-auto max-w-5xl px-4 py-8 pb-28">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Update Problem</h1>
          <p className="text-base-content/60 mt-2">
            Select a problem to edit its details, test cases, and code templates.
          </p>
        </div>

        {error && (
          <div className="alert alert-error mb-6 shadow-sm">
            <span>{error}</span>
          </div>
        )}

        {problems.length === 0 ? (
          <div className={`rounded-xl border bg-base-100 p-8 text-center transition-colors duration-200 ${borders.card}`}>
            <p className="text-base-content/60">No problems found. Create one first.</p>
            <NavLink to="/admin/create" className="btn btn-primary btn-sm mt-4">
              Create Problem
            </NavLink>
          </div>
        ) : (
          <div className={`card bg-base-100 shadow-md border overflow-hidden transition-colors duration-200 ${borders.card}`}>
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Difficulty</th>
                    <th>Tags</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {problems.map((problem, index) => (
                    <tr key={problem._id}>
                      <th>{index + 1}</th>
                      <td className="font-medium">{problem.title}</td>
                      <td>
                        <span className={`badge capitalize ${difficultyBadge(problem.difficulty)}`}>
                          {problem.difficulty}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-outline">{problem.tags}</span>
                      </td>
                      <td>
                        <NavLink
                          to={`/admin/update/${problem._id}`}
                          className="btn btn-sm btn-warning gap-1"
                        >
                          <Edit size={14} />
                          Edit
                        </NavLink>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminUpdate;
