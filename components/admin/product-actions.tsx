"use client";

import { Button } from "@/components/ui/button";
import { AlertModal } from "@/components/ui/alert-modal"; // <--- Importamos o modal novo
import { supabase } from "@/lib/supabase";
import { Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ProductActionsProps {
  productId: number;
}

export default function ProductActions({ productId }: ProductActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false); // Controla se o modal está aberto
  const [loading, setLoading] = useState(false);

  // Essa função agora só abre o modal, não deleta direto
  const onDelete = async () => {
    try {
      setLoading(true);
      await supabase.from("products").delete().eq("id", productId);
      router.refresh();
    } catch (error) {
      alert("Erro ao excluir.");
    } finally {
      setLoading(false);
      setOpen(false); // Fecha o modal
    }
  };

  return (
    <>
      {/* O Modal fica aqui "escondido", só aparece quando open for true */}
      <AlertModal 
        isOpen={open} 
        onClose={() => setOpen(false)}
        onConfirm={onDelete}
        loading={loading}
        title="Excluir produto?"
        description="Essa ação não pode ser desfeita. O produto será removido permanentemente da sua loja."
      />

      <div className="flex items-center justify-end gap-2">
        <Button 
            variant="ghost" 
            size="icon" 
            className="text-zinc-400 hover:text-white"
            onClick={() => router.push(`/admin/produtos/editar/${productId}`)} 
        >
            <Edit size={16} />
        </Button>
        
        <Button 
            variant="ghost" 
            size="icon" 
            className="text-zinc-400 hover:bg-red-900/20 hover:text-red-500"
            onClick={() => setOpen(true)} // <--- Aqui abrimos o modal
        >
            <Trash2 size={16} />
        </Button>
      </div>
    </>
  );
}