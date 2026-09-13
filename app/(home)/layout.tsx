import Navbar from "@/components/navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="h-full flex">
      <div className=" h-[80px] fixed inset-y-0 w-full z-50">
        <Navbar />
      </div>
      <main className="w-full pt-[80px] h-full">
        {children}
      </main>
    </div>
  );
}
