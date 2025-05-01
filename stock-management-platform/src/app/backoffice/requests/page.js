'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function RequestsPage() {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);

  // Buscar evento ativo
  useEffect(() => {
    const fetchActiveEvent = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .single();
      
      if (!error) setActiveEvent(data);
    };
    
    fetchActiveEvent();
  }, []);

  // Configurar real-time para pedidos pendentes
  useEffect(() => {
    if (!activeEvent) return;
    
    const channel = supabase
      .channel('pending_orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `status=eq.pending,event_id=eq.${activeEvent.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setPendingOrders(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setPendingOrders(prev => prev.filter(order => order.id !== payload.new.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeEvent]);

  // Buscar pedidos pendentes iniciais
  useEffect(() => {
    if (!activeEvent) return;
    
    const fetchPendingOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          table:table_id(*),
          items:order_items(*, product:product_id(*))
        `)
        .eq('status', 'pending')
        .eq('event_id', activeEvent.id)
        .order('created_at', { ascending: false });
      
      if (!error) setPendingOrders(data);
    };
    
    fetchPendingOrders();
  }, [activeEvent]);

  const handleOrderAction = async (orderId, action) => {
    await supabase
      .from('orders')
      .update({ 
        status: action,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);
    
    // Atualizar status da mesa se necessário
    if (action === 'accepted') {
      // Implementar lógica para atualizar mesa
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Pending Requests</h2>
      
      {!activeEvent ? (
        <p>No active event. Please create an event first.</p>
      ) : (
        <div className="space-y-4">
          {pendingOrders.map(order => (
            <div key={order.id} className="bg-gray-800 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Table {order.table.number}</h3>
                <span className="text-sm text-gray-400">
                  {new Date(order.created_at).toLocaleTimeString()}
                </span>
              </div>
              
              <div className="mb-3">
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between py-1 border-b border-gray-700">
                    <span>{item.quantity}x {item.product.name}</span>
                    <span>€{(item.quantity * item.discounted_price_at_order).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2 justify-end">
                <button 
                  onClick={() => handleOrderAction(order.id, 'rejected')}
                  className="px-3 py-1 bg-red-600 rounded"
                >
                  Reject
                </button>
                <button 
                  onClick={() => handleOrderAction(order.id, 'accepted')}
                  className="px-3 py-1 bg-green-600 rounded"
                >
                  Accept
                </button>
              </div>
            </div>
          ))}
          
          {pendingOrders.length === 0 && (
            <p>No pending requests at the moment.</p>
          )}
        </div>
      )}
    </div>
  );
}