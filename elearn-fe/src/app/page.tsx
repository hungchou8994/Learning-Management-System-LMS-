import HomeOne from "@/components/homes/home-one";
import Wrapper from "@/layouts/Wrapper";
import { AuthProvider } from "@/providers/AuthContext";

export const metadata = {
  title: "Elearn - Learn, Build, Grow",
};
const index = () => {
  return (
    <AuthProvider>
      <Wrapper>
        <HomeOne />
      </Wrapper>
    </AuthProvider>
  );
};

export default index;
