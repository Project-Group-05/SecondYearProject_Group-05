import Navbar from '../../components/layout/Navbar';

export default function DashboardLayout({ children }) {
  return (
    <>
      <Navbar />
      <div className="main-content">
        {children}
      </div>
    </>
  );
}