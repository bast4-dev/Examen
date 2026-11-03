// src/pages/Admin.jsx
import React, { useState, useEffect } from "react";
import {
  getOrders,
  updateOrderStatus,
  validateOrder,
  getProducts,
  updateProductStock,
} from "../services/adminApi";
import { getErrorMessage } from "../services/http";

// Actions possibles selon le statut actuel d'une commande
const NEXT_ACTIONS = {
  "En attente": [{ label: "Valider la commande", validate: true, className: "bg-green-500" }],
  "En cours de traitement": [{ label: 'Changer état à "Expédiée"', status: "Expédiée", className: "bg-blue-500" }],
  "Expédiée": [{ label: 'Changer état à "Délivrée"', status: "Délivrée", className: "bg-blue-500" }],
};
const CANCELLABLE = ["En attente", "En cours de traitement"];

const Admin = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(null);
  const [newStock, setNewStock] = useState({}); // Stock temporaire par produit
  const [updatingStock, setUpdatingStock] = useState(null); // Stock en cours de mise à jour

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersResponse, productsResponse] = await Promise.all([getOrders(), getProducts()]);
        setOrders(ordersResponse.data);
        setProducts(productsResponse.data);
      } catch (err) {
        setError(getErrorMessage(err, "Impossible de charger les données d'administration."));
      }
    };

    fetchData();
  }, []);

  const productName = (productId) => products.find((p) => p._id === productId)?.name || productId;

  const refreshProducts = async () => {
    try {
      const response = await getProducts();
      setProducts(response.data);
    } catch {
      // l'affichage existant reste valable
    }
  };

  const handleOrderAction = async (orderId, action) => {
    setLoadingOrder(orderId); // Active le loader
    try {
      const response = action.validate
        ? await validateOrder(orderId)
        : await updateOrderStatus(orderId, action.status);
      const updated = response.data.order;

      // Mettre à jour l'état local après une mise à jour réussie
      setOrders((prevOrders) => prevOrders.map((order) => (order._id === orderId ? updated : order)));
      if (updated.status === "Annulée") await refreshProducts(); // le stock a été restitué

      alert(`Statut de la commande ${orderId} mis à jour en "${updated.status}".`);
    } catch (err) {
      alert(getErrorMessage(err, "Erreur lors de la mise à jour du statut de la commande."));
    } finally {
      setLoadingOrder(null); // Désactive le loader
    }
  };

  const handleStockUpdate = async (productId) => {
    const rawValue = newStock[productId] ?? ""; // Récupère la valeur saisie pour ce produit
    const stockValue = Number(rawValue);

    // 0 est une valeur valide (rupture de stock)
    if (rawValue === "" || !Number.isInteger(stockValue) || stockValue < 0) {
      alert("Veuillez entrer une quantité de stock valide (entier positif ou nul).");
      return;
    }

    try {
      setUpdatingStock(productId); // Active le loader
      const response = await updateProductStock(productId, stockValue);
      alert(`Stock du produit mis à jour à ${stockValue}.`);

      // Mise à jour de l'affichage avec la valeur confirmée par le serveur
      setProducts((prev) => prev.map((product) => (product._id === productId ? response.data.product : product)));

      // Réinitialisation du champ
      setNewStock({ ...newStock, [productId]: "" });
    } catch (err) {
      alert(getErrorMessage(err, "Échec de la mise à jour du stock."));
    } finally {
      setUpdatingStock(null); // Désactive le loader
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Page d'administration</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Gestion des Commandes */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold">Gestion des Commandes</h3>
        {orders.length === 0 && !error && <p className="text-gray-500">Aucune commande.</p>}
        <ul>
          {orders.map((order) => (
            <li key={order._id} className="border p-4 mb-4 rounded shadow">
              <p>
                <strong>ID :</strong> {order._id}
              </p>
              <p>
                <strong>Status :</strong> {order.status}
              </p>
              {(NEXT_ACTIONS[order.status] || []).map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleOrderAction(order._id, action)}
                  className={`${action.className} text-white px-2 py-1 mt-2 rounded mr-2 disabled:opacity-50`}
                  disabled={loadingOrder === order._id}
                >
                  {loadingOrder === order._id ? "Mise à jour..." : action.label}
                </button>
              ))}

              {CANCELLABLE.includes(order.status) && (
                <button
                  onClick={() =>
                    window.confirm("Annuler cette commande ? Les produits seront remis en stock.") &&
                    handleOrderAction(order._id, { status: "Annulée" })
                  }
                  className="bg-red-500 text-white px-2 py-1 mt-2 rounded mr-2 disabled:opacity-50"
                  disabled={loadingOrder === order._id}
                >
                  Annuler
                </button>
              )}

              <button
                onClick={() => setSelectedOrder(order)}
                className="bg-gray-500 text-white px-2 py-1 mt-2 rounded"
              >
                Détails
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Gestion des Produits */}
      <div>
        <h2 className="text-xl font-bold">Gestion des Produits</h2>
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-4 py-2">Nom</th>
              <th className="border px-4 py-2">Prix</th>
              <th className="border px-4 py-2">Stock</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id} className="border">
                <td className="border px-4 py-2">{product.name}</td>
                <td className="border px-4 py-2">{product.price} €</td>
                <td className="border px-4 py-2">{product.stock}</td>
                <td className="border px-4 py-2 flex">
                  <input
                    type="number"
                    placeholder="Nouveau stock"
                    min="0"
                    step="1"
                    value={newStock[product._id] ?? ""}
                    className="border p-2 w-20"
                    onChange={(e) =>
                      setNewStock({
                        ...newStock,
                        [product._id]: e.target.value,
                      })
                    }
                  />
                  <button
                    onClick={() => handleStockUpdate(product._id)}
                    className="bg-green-500 text-white px-2 py-1 ml-2 rounded"
                    disabled={updatingStock === product._id}
                  >
                    {updatingStock === product._id
                      ? "Mise à jour..."
                      : "Mettre à jour"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Fenêtre modale pour afficher les détails de la commande */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/2">
            <h2 className="text-xl font-bold mb-4">Détails de la Commande</h2>
            <p>
              <strong>ID :</strong> {selectedOrder._id}
            </p>
            <p>
              <strong>Status :</strong> {selectedOrder.status}
            </p>
            <p>
              <strong>Total :</strong> {selectedOrder.total} €
            </p>
            <p>
              <strong>Livraison :</strong> {selectedOrder.shippingMethod} — {selectedOrder.shippingAddress?.street},{" "}
              {selectedOrder.shippingAddress?.postalCode} {selectedOrder.shippingAddress?.city}
            </p>
            <p>
              <strong>Paiement :</strong> {selectedOrder.paymentMethod}
            </p>
            <h3 className="text-lg font-semibold mt-4">Produits :</h3>
            <ul className="mt-2">
              {selectedOrder.items.map((item, index) => (
                <li key={index} className="border-b p-2">
                  <p>
                    <strong>Produit :</strong> {productName(item.productId)}
                  </p>
                  <p>
                    <strong>Quantité :</strong> {item.quantity}
                  </p>
                  <p>
                    <strong>Prix :</strong> {item.price} €
                  </p>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setSelectedOrder(null)}
              className="bg-red-500 text-white px-4 py-2 mt-4 rounded"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
