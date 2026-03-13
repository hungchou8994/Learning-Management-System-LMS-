import ContactForm from "@/forms/ContactForm";
import InjectableSvg from "@/hooks/InjectableSvg";
import BtnArrow from "@/svg/BtnArrow";
import Link from "next/link";

const ContactArea = () => {
  return (
    <section className="contact-area section-py-120 pt-5 pb-10">
      <div className="container">
        <div className="row">
          <div className="col-lg-4">
            <div className="contact-info-wrap">
              <ul className="list-wrap">
                <li>
                  <div className="icon">
                    <InjectableSvg
                      src="assets/img/icons/map.svg"
                      alt="img"
                      className="injectable"
                    />
                  </div>
                  <div className="content">
                    <h4 className="title">Address</h4>
                    <p>
                      Chung cư HT Pearl, 123 Nguyễn Văn Linh, P.2, Q.Bình Thạnh,
                      TP.HCM
                    </p>
                  </div>
                </li>
                <li>
                  <div className="icon">
                    <InjectableSvg
                      src="assets/img/icons/contact_phone.svg"
                      alt="img"
                      className="injectable"
                    />
                  </div>
                  <div className="content">
                    <h4 className="title">Phone</h4>
                    <Link href="tel:0123456789">091 4484 221 (Khánh)</Link>
                    <Link href="tel:0123456789">036 2826 041 (Huy)</Link>
                  </div>
                </li>
                <li>
                  <div className="icon">
                    <InjectableSvg
                      src="assets/img/icons/emial.svg"
                      alt="img"
                      className="injectable"
                    />
                  </div>
                  <div className="content">
                    <h4 className="title">E-mail Address</h4>
                    <Link href="mailto:info@gmail.com">
                      nerkar.tran@gmail.com
                    </Link>
                    <Link href="mailto:info@gmail.com">
                      nk.content.riotgames@gmail.com
                    </Link>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="contact-form-wrap">
              <h4 className="title">Send Us Message</h4>
              <p>
                Your email address will not be published. Required fields are
                marked *
              </p>
              <ContactForm />
              <p className="ajax-response mb-0"></p>
            </div>
          </div>
        </div>
        <div className="contact-map">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3917.9851186415153!2d106.7832888759787!3d10.888735157110185!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3174d94cad4c6827%3A0xa995be83e3f54f52!2sChung%20c%C6%B0%20HT%20Pearl!5e0!3m2!1svi!2s!4v1745746010922!5m2!1svi!2s"
            style={{ border: "0" }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>
    </section>
  );
};

export default ContactArea;
