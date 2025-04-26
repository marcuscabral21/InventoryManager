// backoffice/stock.js
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client'; // Usando alias

export default function StockPage() {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    stock: 0,
    price: 0,
    discounted_price: 0
  });
  const [editingId, setEditingId] = useState(null);

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });
    
    if (!error) setProducts(data || []);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'name' ? value : Number(value)
    });
  };

  // Submit form (create/update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingId) {
      await supabase
        .from('products')
        .update(formData)
        .eq('id', editingId);
    } else {
      await supabase
        .from('products')
        .insert([formData]);
    }
    
    fetchProducts();
    resetForm();
  };

  // Edit product
  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      stock: product.stock,
      price: product.price,
      discounted_price: product.discounted_price
    });
    setEditingId(product.id);
  };

  // Delete product
  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await supabase
        .from('products')
        .delete()
        .eq('id', id);
      fetchProducts();
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      stock: 0,
      price: 0,
      discounted_price: 0
    });
    setEditingId(null);
  };

  // Format price with € symbol
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold font-mono mb-6">Inventory Manager</h2>
      
      {/* CRUD Form */}
      <div className="bg-gray-800 p-6 rounded-lg shadow mb-8">
        <h3 className="text-xl font-mono mb-4">
          {editingId ? 'Edit Product' : 'Add New Product'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono mb-1">Product name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-700 rounded"
                required
              />
            </div>
            
            <div>
              <label className="block font-mono mb-1">Quantity in Stock</label>
              <input
                type="number"
                name="stock"
                min="0"
                value={formData.stock}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-700 rounded"
                required
              />
            </div>
            
            <div>
              <label className="block font-mono mb-1">Normal price</label>
              <div className="relative">
                <input
                  type="number"
                  name="price"
                  min="0"
                  step="1"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 rounded pl-8"
                  required
                />
                <span className="absolute right-2 top-2">€</span>
              </div>
            </div>
            
            <div>
              <label className="block font-mono mb-1">Discounted price</label>
              <div className="relative">
                <input
                  type="number"
                  name="discounted_price"
                  min="0"
                  step="1"
                  value={formData.discounted_price}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 rounded pl-8"
                  required
                />
                <span className="absolute right-2 top-2">€</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="bg-green-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-mono"
            >
              {editingId ? 'Update' : 'Add'}
            </button>
            
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-red-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-mono"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
      
      {/* Products Table */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
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
                      className="text-yellow-400 hover:text-yellow-300 font-mono"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-400 hover:text-red-300 font-mono"
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