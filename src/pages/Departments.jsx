import { useQuery } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { api } from '../services/api.js';
export default function Departments() {
  const query = useQuery({
    queryKey: ['departments'],
    queryFn: async ({ signal }) =>
      (await api.get('/departments', { signal })).data.data,
    staleTime: 300000,
  });
  return (
    <section>
      <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
      <p className="mt-2 text-sm text-[#66738f]">
        The five teams at AdBorn Solutions.
      </p>
      {query.isPending ? (
        <p role="status" className="py-8">
          Loading departments…
        </p>
      ) : query.isError ? (
        <div role="alert" className="py-8">
          <p>Unable to load departments.</p>
          <button
            className="mt-3 cursor-pointer text-[#006eb5]"
            onClick={() => query.refetch()}
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {query.data.map((department) => (
            <article
              key={department.id}
              className="rounded-[18px] border border-[#e7edf5] bg-white p-6 shadow-sm"
            >
              <span className="inline-flex rounded-xl bg-[#eaf5fc] p-3 text-[#006eb5]">
                <Building2 size={23} />
              </span>
              <h2 className="mt-4 text-lg font-semibold">{department.name}</h2>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
