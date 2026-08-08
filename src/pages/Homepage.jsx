import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import { useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient';
import Navbar from '../components/Navbar';
import { getDifficultyBadgeClass, getTagBadgeClass, getSolvedBadgeClass } from '../utils/problemBadges';

function Homepage() {
  const { user } = useSelector((state) => state.auth);
  const [problems, setProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [filters, setFilters] = useState({
    difficulty: 'all',
    tag: 'all',
    status: 'all',
  });

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const { data } = await axiosClient.get('/problem/getAllProblem');
        setProblems(data);
      } catch (error) {
        console.error('Error fetching problems:', error);
      }
    };

    const fetchSolvedProblems = async () => {
      try {
        const { data } = await axiosClient.get('/problem/problemSolvedByUser');
        setSolvedProblems(data);
      } catch (error) {
        console.error('Error fetching solved problems:', error);
      }
    };

    fetchProblems();
    if (user) fetchSolvedProblems();
  }, [user]);

  const filteredProblems = problems.filter((problem) => {
    const difficultyMatch =
      filters.difficulty === 'all' || problem.difficulty === filters.difficulty;
    const tagMatch = filters.tag === 'all' || problem.tags === filters.tag;
    const statusMatch =
      filters.status === 'all' ||
      solvedProblems.some((sp) => sp._id === problem._id);
    return difficultyMatch && tagMatch && statusMatch;
  });

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div className="container mx-auto p-4">
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            className="select select-bordered rounded-xl"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="all">All Problems</option>
            <option value="solved">Solved Problems</option>
          </select>

          <select
            className="select select-bordered rounded-xl"
            value={filters.difficulty}
            onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select
            className="select select-bordered rounded-xl"
            value={filters.tag}
            onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
          >
            <option value="all">All Tags</option>
            <option value="array">Array</option>
            <option value="linkedList">Linked List</option>
            <option value="graph">Graph</option>
            <option value="dp">DP</option>
          </select>
        </div>

        <div className="grid gap-4">
          {filteredProblems.map((problem) => {
            const isSolved = solvedProblems.some((sp) => sp._id === problem._id);

            return (
              <div
                key={problem._id}
                className="card bg-base-100 shadow-sm rounded-xl border border-base-300"
              >
                <div className="card-body py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="card-title text-lg">
                        <NavLink
                          to={`/problem/${problem._id}`}
                          className="hover:text-primary"
                        >
                          {problem.title}
                        </NavLink>
                      </h2>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span
                          className={`badge capitalize rounded-full px-3 font-normal ${getDifficultyBadgeClass(problem.difficulty)}`}
                        >
                          {problem.difficulty}
                        </span>
                        <span
                          className={`badge rounded-full px-3 font-normal ${getTagBadgeClass()}`}
                        >
                          {problem.tags}
                        </span>
                      </div>
                    </div>

                    {isSolved && (
                      <div
                        className={`badge gap-1.5 rounded-full px-3 shrink-0 font-normal ${getSolvedBadgeClass()}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3.5 w-3.5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Solved
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Homepage;
