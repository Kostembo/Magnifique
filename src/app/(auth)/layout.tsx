export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`body { background-color: #000 !important; }`}</style>
      <div
        className="fixed inset-0 bg-black overflow-hidden flex items-center justify-center p-4"
        style={{ touchAction: "none" }}
      >
        {children}
      </div>
    </>
  );
}
