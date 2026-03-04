import { Outlet } from "react-router-dom";
import HomeHeader from "./HomeHeader";
import AgentHeader from "./AgentHeader";
import HomeFooter from "./HomeFooter";
import AgentFooter from "./AgentFooter";
import { useDomain } from "../contexts/DomainContext";

function HomeLayout() {
  const { domainInfo } = useDomain();
  const hostname = domainInfo?.hostname || window.location.hostname;
  const isPropel = hostname?.includes('propel');

  return (
    <>
      {isPropel ? <AgentHeader /> : <HomeHeader />}

      <main>
        <Outlet />
      </main>

      {isPropel ? <AgentFooter /> : <HomeFooter />}
    </>
  );
}

export default HomeLayout;
