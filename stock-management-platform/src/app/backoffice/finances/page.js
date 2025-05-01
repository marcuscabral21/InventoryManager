'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function FinancesPage() {
  const [tablesData, setTablesData] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase.from('events').select('*').order('start_time', { ascending: false });
      setEvents(data || []);
      if (data && data.length > 0) setSelectedEvent(data[0].id);
    };
    
    fetchEvents();
  }, []);

  useEffect(() => {
    if (!selectedEvent) return;
    
    const fetchTablesFinances = async () => {
      // Buscar mesas com pedidos aceitos no evento selecionado
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          table_id,
          table:table_id(number),
          items:order_items(*, product:product_id(*))
        `)
        .eq('status', 'accepted')
        .eq('event_id', selectedEvent);
      
      // Agrupar por mesa
      const groupedByTable = orders.reduce((acc, order) => {
        if (!acc[order.table_id]) {
          acc[order.table_id] = {
            table: order.table,
            items: [],
            total: 0
          };
        }
        
        order.items.forEach(item => {
          acc[order.table_id].items.push(item);
          acc[order.table_id].total += item.quantity * item.discounted_price_at_order;
        });
        
        return acc;
      }, {});
      
      setTablesData(Object.values(groupedByTable));
    };
    
    fetchTablesFinances();
  }, [selectedEvent]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Finances</h2>
      
      <div className="mb-6">
        <label className="block mb-1">Select Event</label>
        <select 
          value={selectedEvent || ''}
          onChange={(e) => setSelectedEvent(e.target.value || null)}
          className="bg-gray-700 p-2 rounded"
        >
          {events.map(event => (
            <option key={event.id} value={event.id}>
              {event.name} ({new Date(event.start_time).toLocaleDateString()})
            </option>
          ))}
        </select>
      </div>
      
      <div className="space-y-6">
        {tablesData.map(table => (
          <div key={table.table.number} className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Table {table.table.number}</h3>
            
            <div className="mb-4">
              {table.items.map((item, index) => (
                <div key={index} className="flex justify-between py-2 border-b border-gray-700">
                  <div>
                    <span>{item.quantity}x {item.product.name}</span>
                    <span className="block text-sm text-gray-400">
                      €{item.discounted_price_at_order.toFixed(2)} each
                    </span>
                  </div>
                  <span>€{(item.quantity * item.discounted_price_at_order).toFixed(2)}</span>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-gray-700">
              <span className="font-semibold text-lg">Total</span>
              <span className="font-semibold text-lg">€{table.total.toFixed(2)}</span>
            </div>
          </div>
        ))}
        
        {tablesData.length === 0 && (
          <p>No financial data available for the selected event.</p>
        )}
      </div>
    </div>
  );
}