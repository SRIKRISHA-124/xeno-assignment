'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  IndianRupee, 
  RefreshCw, 
  Users, 
  ShoppingCart,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  last_order_date: string;
  total_spent: number;
  order_count: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [minSpent, setMinSpent] = useState<number>(0);
  const [inactiveDays, setInactiveDays] = useState<string>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const fetchCustomersData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/metrics'); // Can load from DB via client fallback
      const data = await res.json();
      
      // Let's call our main db getCustomers API via chat or directly
      // To get all customers without filters, we hit /api/metrics but we can load from a simple API.
      // Wait, let's create a small client-side fetch from database
      const custRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Select all customers' })
      });
      const custData = await custRes.json();
      
      if (custData.success && custData.workflow && custData.workflow.segment_filters) {
        // Fetch all customers using the API
        const response = await fetch('/api/metrics');
        // Let's fallback: since our metrics returns aggregate, we can also load customers by performing a broader query
      }
    } catch (e) {
      console.error(e);
    } finally {
      // Since we already seeded the DB with 500 customers in db.ts,
      // let's fetch the actual seeded database from the server via a dedicated route
      // Wait! Let's check: we need a GET /api/customers route to fetch all customers.
      // Let's create a GET /api/customers route to retrieve the customer list!
      // For now, let's write a fetch for it, and then we will write the API route file.
      try {
        const response = await fetch('/api/customers');
        const data = await response.json();
        if (data.success) {
          setCustomers(data.customers);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomersData();
  }, []);

  // Filter Logic (Client-side search and range filters)
  const filteredCustomers = customers.filter(c => {
    // 1. Search Query Match
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);

    // 2. City Match
    const matchesCity = !selectedCity || c.city === selectedCity;

    // 3. Minimum Spent Match
    const matchesSpent = c.total_spent >= minSpent;

    // 4. Inactivity Match
    let matchesInactivity = true;
    if (inactiveDays !== 'all') {
      const days = parseInt(inactiveDays, 10);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      matchesInactivity = new Date(c.last_order_date) <= cutoffDate;
    }

    return matchesSearch && matchesCity && matchesSpent && matchesInactivity;
  });

  // Pagination Calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCity, minSpent, inactiveDays]);

  const uniqueCities = Array.from(new Set(customers.map(c => c.city))).sort();

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Customers</h2>
          <p className="text-sm text-zinc-400">Search and segment customer database profiles.</p>
        </div>
        <button 
          onClick={fetchCustomersData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter and Search Panel */}
      <div className="glass-panel p-6 rounded-xl space-y-4 shadow-lg">
        <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3 mb-2">
          <Filter className="w-4.5 h-4.5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Segment Explorer Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* City Selection */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">City Location</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="">All Cities</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Min Spent Input Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              <span>Min Total Spent</span>
              <span className="text-indigo-400">₹{minSpent.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="0"
              max="50000"
              step="500"
              value={minSpent}
              onChange={(e) => setMinSpent(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-500 h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Inactivity Filter */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Inactivity Period</label>
            <select
              value={inactiveDays}
              onChange={(e) => setInactiveDays(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="all">Active (No inactivity filter)</option>
              <option value="30">Inactive for 30+ days</option>
              <option value="90">Inactive for 90+ days</option>
              <option value="180">Inactive for 180+ days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers List Grid */}
      <div className="glass-panel rounded-xl overflow-hidden shadow-lg border border-zinc-800/80">
        <div className="p-4 border-b border-border bg-[#0c0c0e] flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-400">
            Showing {filteredCustomers.length} matching customers
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider bg-zinc-950/20">
                <th className="py-3 px-5">Name</th>
                <th className="py-3 px-5">Contact info</th>
                <th className="py-3 px-5">City</th>
                <th className="py-3 px-5">Orders</th>
                <th className="py-3 px-5 text-right">Total Spent</th>
                <th className="py-3 px-5">Last Order Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-zinc-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                      Loading customer segment records...
                    </div>
                  </td>
                </tr>
              ) : currentCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    No customers match the active filter criteria. Try expanding your search queries.
                  </td>
                </tr>
              ) : (
                currentCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-zinc-900/35 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-white">{cust.name}</td>
                    <td className="py-3.5 px-5">
                      <p className="font-medium">{cust.email}</p>
                      <p className="text-[10px] text-zinc-500">{cust.phone}</p>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                        {cust.city}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-medium">{cust.order_count} orders</td>
                    <td className="py-3.5 px-5 text-right font-semibold text-emerald-400">
                      ₹{cust.total_spent.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 text-zinc-400 font-mono">
                      {new Date(cust.last_order_date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border bg-[#0c0c0e] flex items-center justify-between text-xs">
            <span className="text-zinc-500">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                // simple pagination display centering current page
                let pageNum = idx + 1;
                if (currentPage > 3 && totalPages > 5) {
                  pageNum = currentPage - 3 + idx;
                  if (pageNum + (4 - idx) > totalPages) {
                    pageNum = totalPages - 4 + idx;
                  }
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-2.5 py-1 rounded border font-semibold ${
                      currentPage === pageNum
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    } transition`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
