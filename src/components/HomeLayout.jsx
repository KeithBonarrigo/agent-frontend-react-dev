import { Outlet } from "react-router-dom";
import HomeHeader from "./HomeHeader";
import HomeFooter from "./HomeFooter";
import AgentFooter from "./AgentFooter";
import { useDomain } from "../contexts/DomainContext";

function HomeLayout() {
  const { domainInfo } = useDomain();
  const hostname = domainInfo?.hostname || window.location.hostname;
  const isPropel = hostname === 'localhost' || hostname?.includes('propel');

  return (
    <>
      <HomeHeader />

      <main>
        <Outlet />
      </main>

      {isPropel ? <AgentFooter /> : <HomeFooter />}
    </>
  );
}

export default HomeLayout;
