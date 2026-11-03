import { createContext, useContext, useReducer } from 'react';

const CartContext = createContext();

// État vide du panier (utilisé au démarrage et à la déconnexion)
const initialCartState = {
  cart: [],
  shippingMethod: '',
  paymentMethod: '',
  shippingAddress: {
    street: '',
    city: '',
    postalCode: '',
    country: '',
  },
};

// Reducer pur : l'état existant n'est jamais modifié directement (React peut l'appeler deux fois)
export const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existing = state.cart.find((item) => item.id === action.payload.id);

      if (existing) {
        const quantity = existing.quantity + (action.payload.quantity || 1);
        // On ne peut pas dépasser le stock disponible
        if (existing.stock !== undefined && quantity > existing.stock) return state;
        return {
          ...state,
          cart: state.cart.map((item) => (item.id === existing.id ? { ...item, quantity } : item)),
        };
      }
      if (action.payload.stock !== undefined && action.payload.stock < 1) return state;
      return {
        ...state,
        cart: [...state.cart, { ...action.payload, quantity: 1 }],
      };
    }

    case 'DECREMENT_QUANTITY':
      return {
        ...state,
        cart: state.cart.map((item) =>
          item.id === action.payload.id
            ? { ...item, quantity: Math.max(item.quantity - 1, 1) } // Ne peut pas être inférieur à 1
            : item
        ),
      };

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter((item) => item.id !== action.payload.id),
      };

    case 'CLEAR_CART':
      return { ...state, cart: [] };

    // Déconnexion : on efface aussi l'adresse et les choix de livraison/paiement (données personnelles)
    case 'RESET':
      return initialCartState;

    case 'SET_SHIPPING_METHOD':
      return { ...state, shippingMethod: action.payload };

    case 'SET_PAYMENT_METHOD':
      return { ...state, paymentMethod: action.payload };

    case 'SET_SHIPPING_ADDRESS':
      return { ...state, shippingAddress: action.payload };

    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [cartState, dispatch] = useReducer(cartReducer, initialCartState);

  return <CartContext.Provider value={{ ...cartState, dispatch }}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
