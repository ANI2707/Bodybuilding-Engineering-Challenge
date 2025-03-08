import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-5xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          Bodybuilding Advice & Protein Factory Simulator
        </h1>
        <p className="text-xl max-w-2xl mb-12 text-gray-300">
          Get expert bodybuilding advice powered by AI and test your optimization skills with our protein factory simulator.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          <Link href="/advice" 
            className="group bg-gradient-to-br from-blue-500 to-blue-700 p-6 rounded-lg shadow-xl transform transition-all hover:scale-105 hover:shadow-2xl">
            <h2 className="text-2xl font-bold mb-3">🧠 Bodybuilding Advice</h2>
            <p className="text-gray-100">
              Ask questions about workouts, nutrition, and recovery to get personalized bodybuilding advice from AI.
            </p>
          </Link>
          
          <Link href="/factory" 
            className="group bg-gradient-to-br from-purple-500 to-purple-700 p-6 rounded-lg shadow-xl transform transition-all hover:scale-105 hover:shadow-2xl">
            <h2 className="text-2xl font-bold mb-3">🏭 Protein Factory</h2>
            <p className="text-gray-100">
              Optimize your protein powder production by configuring your factory machines while staying within energy limits.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}