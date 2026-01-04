import { Outlet } from "react-router-dom";
import HomeHeader from "./HomeHeader";
import HomeFooter from "./HomeFooter";

function HomeLayout() {
  return (
    <>
      <HomeHeader />

      <main>
        <Outlet />
      </main>

      <HomeFooter />
    </>
  );
}

export default HomeLayout;
