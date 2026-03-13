"use client";
import Link from "next/link";
import CheckOutForm from "./CheckOutForm";
import { useSelector, useDispatch } from "react-redux";
import UseCartInfo from "@/hooks/UseCartInfo";
import { toast } from "react-toastify";
import Image from "next/image";
import { clear_cart } from "@/redux/features/cartSlice";
import { useRouter } from "next/navigation";

const CheckOutArea = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const productItem = useSelector((state: any) => state.cart.cart);
  const { total } = UseCartInfo();

  const handlePlaceOrder = async () => {
    try {
      const courseIds = productItem.map((item: any) => item.id);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/elearn/enroll/cart`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            courseIds,
            paymentMethod: "bank", // You might want to make this dynamic based on user selection
          }),
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        toast.success("Successfully enrolled in courses!");
        dispatch(clear_cart());
        router.push("/dashboard"); // Redirect to dashboard after successful enrollment
      } else {
        toast.error(data.message || "Failed to enroll in courses");
      }
    } catch (error) {
      console.error("Error enrolling in courses:", error);
      toast.error("Failed to enroll in courses. Please try again.");
    }
  };

  return (
    <div className="checkout__area section-py-120">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className="coupon__code-wrap">
              <div className="coupon__code-info">
                <span>
                  <i className="far fa-bookmark"></i> Have a coupon?
                </span>
                <Link href="#" id="coupon-element">
                  Click here to enter your code
                </Link>
              </div>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="coupon__code-form"
              >
                <p>If you have a coupon code, please apply it below.</p>
                <input type="text" placeholder="Coupon code" />
                <button type="submit" className="btn">
                  Apply coupon
                </button>
              </form>
            </div>
          </div>

          <CheckOutForm />

          <div className="col-lg-5">
            <div className="order__info-wrap">
              <h2 className="title">YOUR ORDER</h2>
              <ul className="list-wrap">
                <li className="title">
                  Product <span>Subtotal</span>
                </li>
                {/* <!-- item list --> */}
                {productItem.map((add_item: any, add_index: any) => (
                  <li
                    key={add_index}
                    className="d-flex align-items-center justify-content-between"
                  >
                    <div className="d-flex align-items-center gap-3">
                      <Image
                        src={add_item.thumb}
                        alt={add_item.title}
                        width={50}
                        height={35}
                        style={{
                          objectFit: "cover",
                          borderRadius: "4px",
                        }}
                      />
                      <div>
                        {add_item.title}
                        <strong className="d-block">
                          ${(Number(add_item.price) || 0).toFixed(2)} x{" "}
                          {add_item.quantity}
                        </strong>
                      </div>
                    </div>
                    <span>
                      $
                      {(
                        (Number(add_item.price) || 0) * (add_item.quantity || 1)
                      ).toFixed(2)}
                    </span>
                  </li>
                ))}
                <li>
                  Subtotal <span>${total.toFixed(2)}</span>
                </li>
                <li>
                  Total <span>${total.toFixed(2)}</span>
                </li>
              </ul>
              <p>
                Sorry, it seems that there are no available payment methods for
                your state. Please contact us if you require assistance or wish
                to make alternate arrangements.
              </p>
              <p>
                Your personal data will be used to process your order, support
                your experience throughout this website, and for other purposes
                described in our <Link href="#">privacy policy.</Link>
              </p>
              <button onClick={handlePlaceOrder} className="btn">
                Place order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckOutArea;
