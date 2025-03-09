'use client';

import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { supabase } from '@/utils/supabse';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Machine specifications
const machines = [
  { id: 'A', name: 'Machine A', protein: 10, electricity: 2 },
  { id: 'B', name: 'Machine B', protein: 20, electricity: 5 },
  { id: 'C', name: 'Machine C', protein: 35, electricity: 10 },
  { id: 'D', name: 'Machine D', protein: 50, electricity: 15 },
  { id: 'E', name: 'Machine E', protein: 100, electricity: 40 },
];

// Energy limit
const ENERGY_LIMIT = 50;

// Interface for leaderboard entry
interface LeaderboardEntry {
  id?: string;
  protein: number;
  energy: number;
  user_id?: string; // Optional because guest users might not have an ID
  user_name?: string; // Can be anonymous or a display name
  machine_config: Record<string, number>;
  created_at?: string;
}

export default function FactoryPage() {
  // State for machine runs
  const [machineRuns, setMachineRuns] = useState<Record<string, number>>({
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    E: 0,
  });
  
  // State for calculation results
  const [result, setResult] = useState<{
    valid: boolean;
    protein: number;
    energy: number;
    message: string;
  } | null>(null);
  
  // State for leaderboard from Supabase
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  
  // State for user
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string>('Anonymous');
  const [isLoading, setIsLoading] = useState<boolean>(true);

 useEffect(() => {

    // Check user session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
       if (session?.user) {
        setUserName(session.user.email?.split('@')[0] || 'User');
      }
    });

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );


    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []); 

  useEffect(()=>{
    const fetchData = async() =>{
      setIsLoading(true)
      await fetchLeaderboard();
      setIsLoading(false)
    }
    fetchData();
  },[])

  // Fetch user and leaderboard data on component mount
  // useEffect(() => {
  //   const fetchData = async () => {
  //     setIsLoading(true);
      
  //     // Get current user
  //     const { data: { session } } = await supabase.auth.getSession();
  //     setUser(session?.user || null);
      
  //     // Set user name
  //     if (session?.user) {
  //       setUserName(session.user.email?.split('@')[0] || 'User');
  //     }
      
  //     // Fetch leaderboard data
  //     await fetchLeaderboard();
      
  //     setIsLoading(false);
  //   };
    
  //   fetchData();
    
  //   // Subscribe to auth changes
  //   const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
  //     setUser(session?.user || null);
  //     if (session?.user) {
  //       setUserName(session.user.email?.split('@')[0] || 'User');
  //     } else {
  //       setUserName('Anonymous');
  //     }
  //   });
    
  //   return () => {
  //     authListener?.subscription.unsubscribe();
  //   };
  // }, []);

  // Fetch leaderboard data from Supabase
  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('optimized_leaderboard')
        .select('*')
        .order('protein', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error fetching leaderboard:', error);
        return;
      }
      
      setLeaderboard(data as LeaderboardEntry[]);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    }
  };

  // Add entry to leaderboard in Supabase
  const addToLeaderboard = async (entry: Omit<LeaderboardEntry, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('optimized_leaderboard')
        .insert([entry])
        .select();
      
      if (error) {
        console.error('Error adding to leaderboard:', error);
        return;
      }
      
      // Refresh leaderboard
      await fetchLeaderboard();
    } catch (err) {
      console.error('Failed to add to leaderboard:', err);
    }
  };

  const handleInputChange = (machineId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setMachineRuns({
      ...machineRuns,
      [machineId]: numValue < 0 ? 0 : numValue,
    });
  };

  const calculateResults = async () => {

      if (!user) {
        toast.error('You need to be logged in to get advice.');
        return;
      }
    
    let totalProtein = 0;
    let totalEnergy = 0;

    // Calculate totals
    for (const machine of machines) {
      const runs = machineRuns[machine.id] || 0;
      totalProtein += machine.protein * runs;
      totalEnergy += machine.electricity * runs;
    }

    const valid = totalEnergy <= ENERGY_LIMIT;
    
    // Create result
    const newResult = {
      valid,
      protein: totalProtein,
      energy: totalEnergy,
      message: valid
        ? `Valid! You produced ${totalProtein} grams of protein!`
        : `Invalid! Your electricity consumption is too high! (${totalEnergy}kW / ${ENERGY_LIMIT}kW)`,
    };
    
    setResult(newResult);
    
    // Add to Supabase leaderboard if valid
    if (valid) {
      // Create leaderboard entry
      const entry: Omit<LeaderboardEntry, 'id' | 'created_at'> = {
        protein: totalProtein,
        energy: totalEnergy,
        user_id: user?.id || null,
        user_name: userName,
        machine_config: { ...machineRuns },
      };
      
      // Add to Supabase
      await addToLeaderboard(entry);
    }
  };

  // Prepare chart data
  const chartData = {
    labels: machines.map(m => m.name),
    datasets: [
      {
        label: 'Protein per kW',
        data: machines.map(m => m.protein / m.electricity),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      },
    ],
  };

  // Format machine configuration for display
  const formatMachineConfig = (config: Record<string, number> | string) => {
    let machineConfig: Record<string, number>;
    
    // Parse the config if it's a string (from Supabase JSON)
    if (typeof config === 'string') {
      try {
        machineConfig = JSON.parse(config);
      } catch (e) {
        console.error('Error parsing machine config:', e);
        return 'Invalid configuration';
      }
    } else {
      machineConfig = config;
    }
    
    return Object.entries(machineConfig)
      .filter(([_, value]) => value > 0)
      .map(([key, value]) => `${key}:${value}`)
      .join(', ');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Protein Factory Simulator</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Factory Controls */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Factory Settings</h2>
            <p className="mb-4 text-gray-300">
              Configure how many times each machine runs per hour. Your goal is to maximize protein production while keeping electricity usage under 50 kW.
            </p>
            
            <div className="space-y-4 mb-6">
              {machines.map((machine) => (
                <div key={machine.id} className="flex items-center">
                  <div className="w-32 font-medium">{machine.name}</div>
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <div className="text-sm text-gray-400">
                      {machine.protein}g protein
                    </div>
                    <div className="text-sm text-gray-400">
                      {machine.electricity}kW
                    </div>
                    <div className="text-sm text-gray-400">
                      {(machine.protein / machine.electricity).toFixed(1)}g/kW
                    </div>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={machineRuns[machine.id]}
                    onChange={(e) => handleInputChange(machine.id, e.target.value)}
                    className="ml-4 w-16 p-2 bg-gray-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-400">times/hr</span>
                </div>
              ))}
            </div>
            
            {/* Display current user */}
            <div className="mb-4 text-sm text-gray-400">
              Playing as: <span className="font-semibold">{userName}</span>
              {/* {!user && (
                <span className="ml-2 text-gray-500">(Sign in to save your name on the leaderboard)</span>
              )} */}
            </div>
            
            <button
              onClick={calculateResults}
              className="cursor-pointer w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700"
            >
              Calculate Results
            </button>
            
            {result && (
              <div className={`mt-6 p-4 rounded-md ${result.valid ? 'bg-green-800/40' : 'bg-red-800/40'}`}>
                <h3 className="font-semibold mb-2">Results:</h3>
                <p>{result.message}</p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-gray-700/50 p-3 rounded-md text-center">
                    <div className="text-sm text-gray-400">Protein</div>
                    <div className="text-2xl font-bold">{result.protein}g</div>
                  </div>
                  <div className="bg-gray-700/50 p-3 rounded-md text-center">
                    <div className="text-sm text-gray-400">Energy</div>
                    <div className="text-2xl font-bold">{result.energy}kW</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Analytics and Leaderboard */}
          <div className="space-y-8">
            {/* Efficiency Graph */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Efficiency Analysis</h2>
              <div className="h-64">
                <Line 
                  data={chartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Protein per kW (g/kW)'
                        }
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'Machine'
                        }
                      }
                    }
                  }}
                />
              </div>
              <p className="mt-4 text-sm text-gray-400">
                This graph shows the efficiency (protein/kW) of each machine. Higher values mean more protein per unit of electricity.
              </p>
            </div>
            
            {/* Global Leaderboard */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Global Optimization Leaderboard</h2>
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : leaderboard.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2">Rank</th>
                        <th className="text-left py-2">Player</th>
                        <th className="text-left py-2">Protein</th>
                        <th className="text-left py-2">Energy</th>
                        <th className="text-left py-2">Configuration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((entry, idx) => (
                        <tr key={idx} className="border-b border-gray-700">
                          <td className="py-2">{idx + 1}</td>
                          <td className="py-2">{entry.user_name || 'Anonymous'}</td>
                          <td className="py-2">{entry.protein}g</td>
                          <td className="py-2">{entry.energy}kW</td>
                          <td className="py-2">
                            {formatMachineConfig(entry.machine_config)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400">No entries in the leaderboard yet. Be the first to optimize your factory!</p>
              )}
              
              <button 
                onClick={fetchLeaderboard}
                className="cursor-pointer mt-4 text-sm text-blue-400 hover:text-blue-300"
              >
                Refresh Leaderboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}