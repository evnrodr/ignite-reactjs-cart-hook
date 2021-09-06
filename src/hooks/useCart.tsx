import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  //CHECK
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const altCart = [...cart];

      const selectedProduct = altCart.find(
        (product) => product.id === productId
      );

      if (selectedProduct) {
        const { data } = await api.get<Stock>(`/stock/${productId}`);

        if (selectedProduct.amount + 1 > data.amount) {
          toast.error("Quantidade solicitada fora de estoque");
          return;
        } else {
          selectedProduct.amount += 1;
        }
      } else {
        const { data } = await api.get<Product>(`/products/${productId}`);

        const newProduct: Product = {
          ...data,
          amount: 1,
        };

        altCart.push(newProduct);
      }

      setCart(altCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(altCart));
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const altCart = [...cart];
      const selectedProduct = altCart.find(
        (product) => product.id === productId
      );

      if (selectedProduct) {
        altCart.splice(
          altCart.findIndex((item) => item.id === productId),
          1
        );
      } else {
        throw Error();
      }

      setCart(altCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(altCart));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }

      const { data } = await api.get<Stock>(`/stock/${productId}`);
      const stock = data.amount;

      if (amount > stock) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const altCart = [...cart];
      const selectedProduct = altCart.find(
        (product) => product.id === productId
      );

      if (selectedProduct) {
        selectedProduct.amount = amount;
        setCart(altCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(altCart));
      } else {
        throw Error();
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
