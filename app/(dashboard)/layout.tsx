import Navbar from "../../components/navbar";
import Sidebar from "./_components/sidebar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="h-full flex dark:bg-background">
      <div className=" h-[80px] md:pr-56 fixed inset-y-0 w-full z-50">
        <Navbar />
      </div>
      <div className="hidden fixed md:flex h-full w-56 flex-col inset-y-0 z-50">
        <Sidebar />
      </div>
      <main className="w-full md:pr-56 pt-[80px] h-full">
        {children}
      </main>
    </div>
  );
}
