export default function ProductPage({ params }: { params: { slug: string } }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-4 pt-20">
      <h1 className="text-2xl font-bold text-white">Detalhes do Produto</h1>
      <p className="text-zinc-400">ID do produto: {params.slug}</p>
      <p className="text-zinc-500">Aqui vai a foto grande, descrição e botão de comprar.</p>
    </div>
  );
}