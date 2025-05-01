'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function EventPage() {
  const [events, setEvents] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    start_time: '',
    end_time: ''
  });
  const [editingEvent, setEditingEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAndUpdateEvents = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: false });
      
      if (data) {
        // Update event statuses based on current time
        const updatedEvents = await Promise.all(data.map(async (event) => {
          const now = new Date();
          const start = new Date(event.start_time);
          const end = new Date(event.end_time);
          
          // Event should be active but isn't
          if (start <= now && end >= now && !event.is_active) {
            // Ensure no other events are active
            await supabase
              .from('events')
              .update({ is_active: false })
              .neq('id', event.id);
            
            const { data: updated } = await supabase
              .from('events')
              .update({ is_active: true })
              .eq('id', event.id)
              .select()
              .single();
            return updated || event;
          }
          
          // Event should be inactive but is active
          if ((now < start || now > end) && event.is_active) {
            const { data: updated } = await supabase
              .from('events')
              .update({ is_active: false })
              .eq('id', event.id)
              .select()
              .single();
            return updated || event;
          }
          
          return event;
        }));
        
        setEvents(updatedEvents);
      }
      setIsLoading(false);
    };
    
    fetchAndUpdateEvents();
    
    // Check every minute for event status updates
    const interval = setInterval(fetchAndUpdateEvents, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    
    if (new Date(formData.end_time) <= new Date(formData.start_time)) {
      alert('A data de fim deve ser após a data de início');
      return;
    }
    
    const now = new Date();
    const startsNow = new Date(formData.start_time) <= now;
    
    if (startsNow) {
      // Deactivate all other events
      await supabase
        .from('events')
        .update({ is_active: false })
        .neq('is_active', false);
    }
    
    const { data } = await supabase
      .from('events')
      .insert([{
        name: formData.name,
        start_time: formData.start_time,
        end_time: formData.end_time,
        is_active: startsNow && new Date(formData.end_time) > now
      }])
      .select()
      .single();
    
    if (data) {
      setEvents(prev => [data, ...prev]);
      setFormData({ name: '', start_time: '', end_time: '' });
    }
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    
    if (new Date(formData.end_time) <= new Date(formData.start_time)) {
      alert('A data de fim deve ser após a data de início');
      return;
    }
    
    const now = new Date();
    const startsNow = new Date(formData.start_time) <= now;
    const endsInFuture = new Date(formData.end_time) > now;
    
    // If this event will become active, deactivate others
    if (startsNow && endsInFuture) {
      await supabase
        .from('events')
        .update({ is_active: false })
        .neq('id', editingEvent.id)
        .neq('is_active', false);
    }
    
    const { data } = await supabase
      .from('events')
      .update({
        name: formData.name,
        start_time: formData.start_time,
        end_time: formData.end_time,
        is_active: startsNow && endsInFuture
      })
      .eq('id', editingEvent.id)
      .select()
      .single();
    
    if (data) {
      setEvents(prev => prev.map(e => e.id === data.id ? data : e));
      setEditingEvent(null);
      setFormData({ name: '', start_time: '', end_time: '' });
    }
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      start_time: event.start_time.slice(0, 16),
      end_time: event.end_time.slice(0, 16)
    });
  };

  const handleCancelEdit = () => {
    setEditingEvent(null);
    setFormData({ name: '', start_time: '', end_time: '' });
  };

  const handleEndEvent = async (eventId) => {
    if (confirm('Você tem a certeza que quer finalizar o evento agora?')) {
      await supabase
        .from('events')
        .update({ 
          is_active: false,
          end_time: new Date().toISOString()
        })
        .eq('id', eventId);
      
      // Refresh events
      const { data } = await supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: false });
      
      if (data) setEvents(data);
    }
  };

  const handleCancelEvent = async (eventId) => {
    if (confirm('Você tem a certeza que quer cancelar este evento?')) {
      // Delete the event completely
      await supabase
        .from('events')
        .delete()
        .eq('id', eventId);
      
      // Refresh events
      const { data } = await supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: false });
      
      if (data) setEvents(data);
    }
  };

  // Classify events
  const now = new Date();
  const currentEvents = events.filter(event => {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    return start <= now && end >= now && event.is_active;
  });

  const futureEvents = events.filter(event => {
    const start = new Date(event.start_time);
    return start > now;
  });

  const pastEvents = events.filter(event => {
    const end = new Date(event.end_time);
    return end < now && !event.is_active;
  });

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate - startDate;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Gestão de Eventos</h1>
      
      {/* Create/Edit Form */}
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
        <h2 className="text-lg font-semibold mb-3">
          {editingEvent ? 'Editar Evento' : 'Criar Novo Evento'}
        </h2>
        
        <form onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent} className="space-y-3">
          <div>
            <label className="block mb-1 text-sm font-medium">Nome do Evento</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full p-2 text-sm bg-gray-700 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
              placeholder="Insira o nome do evento"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block mb-1 text-sm font-medium">Data/Hora Início</label>
              <input
                type="datetime-local"
                name="start_time"
                value={formData.start_time}
                onChange={handleInputChange}
                className="w-full p-2 text-sm bg-gray-700 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
                required
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            
            <div>
              <label className="block mb-1 text-sm font-medium">Data/Hora Fim</label>
              <input
                type="datetime-local"
                name="end_time"
                value={formData.end_time}
                onChange={handleInputChange}
                className="w-full p-2 text-sm bg-gray-700 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
                required
                min={formData.start_time || new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-1">
            {editingEvent && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 py-1 text-sm bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              {editingEvent ? 'Atualizar' : 'Criar Evento'}
            </button>
          </div>
        </form>
      </div>
      
      {isLoading ? (
        <div className="text-center py-6">Carregando eventos...</div>
      ) : (
        <>
          {/* Current Event */}
          {currentEvents.length > 0 && (
            <div className="bg-blue-900 bg-opacity-20 p-4 rounded-lg shadow-lg border border-blue-700">
              <h2 className="text-lg font-semibold mb-3">Evento Atual</h2>
              
              {currentEvents.map(event => (
                <div key={event.id} className="space-y-3">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div>
                      <p className="text-blue-300 text-xs">Nome:</p>
                      <p className="font-medium">{event.name}</p>
                    </div>
                    <div>
                      <p className="text-blue-300 text-xs">Início:</p>
                      <p>{formatDateTime(event.start_time)}</p>
                    </div>
                    <div>
                      <p className="text-blue-300 text-xs">Fim:</p>
                      <p>{formatDateTime(event.end_time)}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleEndEvent(event.id)}
                      className="px-4 py-1 text-sm bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Finalizar Evento
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Future Events - Mobile */}
          {futureEvents.length > 0 && (
            <div className="sm:hidden bg-gray-800 p-4 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold mb-3">Próximos Eventos</h2>
              
              <div className="space-y-3">
                {futureEvents.map(event => (
                  <div key={event.id} className="bg-gray-750 p-3 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{event.name}</h3>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDateTime(event.start_time)} - {formatDateTime(event.end_time)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditEvent(event)}
                          className="text-blue-400 hover:text-blue-300 text-xs"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleCancelEvent(event.id)}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Future Events - Desktop */}
          {futureEvents.length > 0 && (
            <div className="hidden sm:block bg-gray-800 p-4 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold mb-3">Próximos Eventos</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="p-2 text-left text-xs sm:text-sm">Nome</th>
                      <th className="p-2 text-left text-xs sm:text-sm">Início</th>
                      <th className="p-2 text-left text-xs sm:text-sm">Fim</th>
                      <th className="p-2 text-left text-xs sm:text-sm">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {futureEvents.map(event => (
                      <tr key={event.id} className="border-b border-gray-700 hover:bg-gray-750">
                        <td className="p-2">{event.name}</td>
                        <td className="p-2">{formatDateTime(event.start_time)}</td>
                        <td className="p-2">{formatDateTime(event.end_time)}</td>
                        <td className="p-2">
                          <button
                            onClick={() => handleEditEvent(event)}
                            className="text-blue-400 hover:text-blue-300 mr-2 text-xs sm:text-sm"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleCancelEvent(event.id)}
                            className="text-red-400 hover:text-red-300 text-xs sm:text-sm"
                          >
                            Cancelar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Past Events - Mobile */}
          <div className="sm:hidden bg-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-3">Eventos Anteriores</h2>
            
            {pastEvents.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhum evento anterior disponível.</p>
            ) : (
              <div className="space-y-3">
                {pastEvents.map(event => (
                  <div key={event.id} className="bg-gray-750 p-3 rounded-lg">
                    <h3 className="font-medium">{event.name}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDateTime(event.start_time)} - {formatDateTime(event.end_time)}
                    </p>
                    <p className="text-xs mt-1">
                      Duração: {calculateDuration(event.start_time, event.end_time)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Past Events - Desktop */}
          <div className="hidden sm:block bg-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-3">Eventos Anteriores</h2>
            
            {pastEvents.length === 0 ? (
              <p className="text-gray-400">Nenhum evento anterior disponível.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="p-2 text-left text-xs sm:text-sm">Nome</th>
                      <th className="p-2 text-left text-xs sm:text-sm">Início</th>
                      <th className="p-2 text-left text-xs sm:text-sm">Fim</th>
                      <th className="p-2 text-left text-xs sm:text-sm">Duração</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastEvents.map(event => (
                      <tr key={event.id} className="border-b border-gray-700 hover:bg-gray-750">
                        <td className="p-2">{event.name}</td>
                        <td className="p-2">{formatDateTime(event.start_time)}</td>
                        <td className="p-2">{formatDateTime(event.end_time)}</td>
                        <td className="p-2">{calculateDuration(event.start_time, event.end_time)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}