'use client'; // Necessário para indicar que este componente é do lado do cliente (Next.js App Router)
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

// Componente principal da página de Estoque
export default function StockPage() {
  // Estados para armazenar produtos, dados do formulário, ID em edição e campo focado
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    stock: 0,
    price: 0,
    discounted_price: 0
  });
  const [editingId, setEditingId] = useState(null);
  const [focusedField, setFocusedField] = useState(null);

  // Buscar produtos assim que o componente for montado
  useEffect(() => {
    fetchProducts();
  }, []);

  // Função para buscar produtos do banco de dados
  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });
    
    if (!error) setProducts(data || []);
  };

  // Atualizar o estado do formulário ao digitar nos inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'name' ? value : Number(value) // Converte para número, exceto o nome
    });
  };

  // Submeter o formulário: criar ou atualizar produto
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingId) {
      // Atualizar produto existente
      await supabase
        .from('products')
        .update(formData)
        .eq('id', editingId);
    } else {
      await supabase
        .from('products')
        .insert([formData]);
    }
    // Criar novo produto
    fetchProducts(); // Atualiza lista de produtos
    resetForm(); // Limpa o formulário
  };

  // Preencher formulário para editar produto
  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      stock: product.stock,
      price: product.price,
      discounted_price: product.discounted_price
    });
    setEditingId(product.id);
  };

  // Deletar produto
  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await supabase
        .from('products')
        .delete()
        .eq('id', id);
      fetchProducts(); // Atualiza lista após deletar
    }
  };

  // Resetar formulário para valores iniciais
  const resetForm = () => {
    setFormData({
      name: '',
      stock: 0,
      price: 0,
      discounted_price: 0
    });
    setEditingId(null);
  };

  // Função utilitária para formatar preço em Euro (€)
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  // JSX (o que será renderizado)
  return (
    <div className="p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-semibold font-mono mb-4 md:mb-6">Inventory Manager</h2>
      
      {/* CRUD Form */}
      <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow mb-6 md:mb-8">
        <h3 className="text-lg md:text-xl font-mono mb-3 md:mb-4">
          {editingId ? 'Edit Product' : 'Add New Product'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            <div>
              <label className="block text-sm md:text-base font-mono mb-1">Product name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2 text-sm md:text-base bg-gray-700 rounded"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm md:text-base font-mono mb-1">Quantity in Stock</label>
              <input
                type="number"
                name="stock"
                min="0"
                value={focusedField === 'stock' && formData.stock === 0 ? '' : formData.stock}
                onChange={handleInputChange}
                onFocus={() => {
                  setFocusedField('stock');
                  if (formData.stock === 0) {
                    setFormData({...formData, stock: ''});
                  }
                }}
                onBlur={() => {
                  setFocusedField(null);
                  if (formData.stock === '') {
                    setFormData({...formData, stock: 0});
                  }
                }}
                className="w-full p-2 text-sm md:text-base bg-gray-700 rounded"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm md:text-base font-mono mb-1">Normal price</label>
              <div className="relative">
                <input
                  type="number"
                  name="price"
                  min="0"
                  step="0.01"
                  value={focusedField === 'price' && formData.price === 0 ? '' : formData.price}
                  onChange={handleInputChange}
                  onFocus={() => {
                    setFocusedField('price');
                    if (formData.price === 0) {
                      setFormData({...formData, price: ''});
                    }
                  }}
                  onBlur={() => {
                    setFocusedField(null);
                    if (formData.price === '') {
                      setFormData({...formData, price: 0});
                    }
                  }}
                  className="w-full p-2 text-sm md:text-base bg-gray-700 rounded pl-8"
                  required
                />
                <span className="absolute right-2 top-2">€</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm md:text-base font-mono mb-1">Discounted price</label>
              <div className="relative">
                <input
                  type="number"
                  name="discounted_price"
                  min="0"
                  step="0.01"
                  value={focusedField === 'discounted_price' && formData.discounted_price === 0 ? '' : formData.discounted_price}
                  onChange={handleInputChange}
                  onFocus={() => {
                    setFocusedField('discounted_price');
                    if (formData.discounted_price === 0) {
                      setFormData({...formData, discounted_price: ''});
                    }
                  }}
                  onBlur={() => {
                    setFocusedField(null);
                    if (formData.discounted_price === '') {
                      setFormData({...formData, discounted_price: 0});
                    }
                  }}
                  className="w-full p-2 text-sm md:text-base bg-gray-700 rounded pl-8"
                  required
                />
                <span className="absolute right-2 top-2">€</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="text-sm md:text-base bg-green-600 hover:bg-blue-700 text-white px-3 py-1 md:px-4 md:py-2 rounded font-mono"
            >
              {editingId ? 'Update' : 'Add'}
            </button>
            
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm md:text-base bg-red-600 hover:bg-gray-700 text-white px-3 py-1 md:px-4 md:py-2 rounded font-mono"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
      
      {/* Products List - Responsive */}
      <div className="overflow-x-auto">
        {/* Mobile View (Cards) */}
        <div className="md:hidden space-y-3">
          {products.map((product) => (
            <div key={product.id} className="bg-gray-800 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-mono font-semibold text-base">{product.name}</h3>
                  <p className="text-sm font-mono text-gray-300">Stock: {product.stock}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="text-yellow-400 text-sm font-mono px-2 py-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-400 text-sm font-mono px-2 py-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-gray-400 font-mono">Normal Price</p>
                  <p className="font-mono text-sm">{formatPrice(product.price)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-mono">Discounted Price</p>
                  <p className="font-mono text-sm">{formatPrice(product.discounted_price)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View (Table) */}
        <table className="hidden md:table w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left font-mono">Name</th>
              <th className="px-4 py-3 text-left font-mono">Stock</th>
              <th className="px-4 py-3 text-left font-mono">Normal price</th>
              <th className="px-4 py-3 text-left font-mono">Discounted Price</th>
              <th className="px-4 py-3 text-left font-mono">Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t border-gray-700 hover:bg-gray-750">
                <td className="px-4 py-3 font-mono">{product.name}</td>
                <td className="px-4 py-3 font-mono">{product.stock}</td>
                <td className="px-4 py-3 font-mono">{formatPrice(product.price)}</td>
                <td className="px-4 py-3 font-mono">{formatPrice(product.discounted_price)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-yellow-400 hover:text-yellow-300 font-mono text-sm md:text-base"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-400 hover:text-red-300 font-mono text-sm md:text-base"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}