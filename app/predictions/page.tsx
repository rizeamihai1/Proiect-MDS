import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function PredictionsPage() {
  const supabase = createServerComponentClient({ cookies });

  const { data: predictions, error } = await supabase
    .from('match_predictions')
    .select('*')
    .order('id');

  if (error) {
    return <p className="text-red-500">Eroare la fetch: {error.message}</p>;
  }

  if (!predictions || predictions.length === 0) {
    return (
      <div className="p-6">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">← Înapoi</Link>
        <p>Nu există predicții.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">← Înapoi</Link>
      <h1 className="text-2xl font-bold mb-4">Predicții Meciuri</h1>
      <table className="w-full border border-gray-300 text-left">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Gazde</th>
            <th className="p-2">Oaspeți</th>
            <th className="p-2">Rezultat Prezis</th>
            <th className="p-2">Probabilitate</th>
          </tr>
        </thead>
        <tbody>
          {predictions.map((match) => (
            <tr key={match.id} className="border-t border-gray-200">
              <td className="p-2">{match.home_team}</td>
              <td className="p-2">{match.away_team}</td>
              <td className="p-2">{match.predicted_result}</td>
              <td className="p-2">{match.probability}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}