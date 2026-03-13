import BreadcrumbOne from "@/components/common/breadcrumb/BreadcrumbOne";
// import ProductDetails from "@/components/inner-shop/product-details";
import ProductDetailsArea from "@/components/inner-shop/product-details/ProductDetailsArea";
import FooterOne from "@/layouts/footers/FooterOne";
import HeaderOne from "@/layouts/headers/HeaderOne";
import Wrapper from "@/layouts/Wrapper";

export const metadata = {
  title:
    "Shop Details SkillGro - Online Courses & Education React Next js Template",
};
const index = () => {
  return (
    <Wrapper>
      <HeaderOne />
      <main className="main-area fix">
        <BreadcrumbOne title="Shop Details" sub_title="Shop Details" />
        <ProductDetailsArea />
      </main>
      <FooterOne />
    </Wrapper>
  );
};

export default index;
