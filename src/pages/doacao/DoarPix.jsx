export default function DoarPix() {
  return (
    <div className="max-w-md mx-auto bg-white text-black p-6 rounded-xl text-center">
      <h2 className="text-xl font-bold mb-4">
        Doação via PIX
      </h2>

      <img
        src="/pix-qrcode.png"
        alt="QR Code PIX"
        className="mx-auto mb-4"
      />

      <p className="mb-2 font-semibold">
        Chave PIX:
      </p>

      <p className="bg-gray-100 p-3 rounded font-mono mb-4">
        contato@unidosemamor.org
      </p>

      <p className="text-gray-600">
        Sua contribuição financeira ajuda na compra de alimentos
        e manutenção do projeto ❤️
      </p>
    </div>
  )
}
