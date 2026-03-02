import React from 'react';
import { SkeletonCard } from '../metrics/Skeletons';

const DataTable = ({ columns, data, mobileRender, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return null; // El EmptyState se suele manejar por fuera, o lo pasamos como prop
  }

  return (
    <>
      {/* Vista Mobile (Cards apiladas) */}
      <div className="md:hidden space-y-4">
        {data.map((row, i) => (
          <div key={i} className="bg-dark-900 border border-dark-800 rounded-xl p-4 shadow-sm">
            {mobileRender ? mobileRender(row) : (
              <div className="text-dark-400 text-sm">Define un render para mobile</div>
            )}
          </div>
        ))}
      </div>

      {/* Vista Desktop (Tabla clásica) */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-dark-800 bg-dark-900 shadow-sm">
        <table className="w-full text-left text-sm text-dark-200">
          <thead className="bg-dark-800/50 text-dark-300 font-medium border-b border-dark-800">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className={`px-6 py-4 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-800">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-dark-800/30 transition-colors">
                {columns.map((col, j) => (
                  <td key={j} className={`px-6 py-4 whitespace-nowrap ${col.cellClassName || ''}`}>
                    {col.cell ? col.cell(row) : row[col.accessorKey]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default DataTable;
