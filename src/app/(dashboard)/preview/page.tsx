import ArrowLeft from "@/assets/icons/angle-left.svg";
import BackLink from "@/components/shared/BackLink";
import Button from "@/components/shared/Button";
import SmartImage from "@/components/shared/SmartImage";

export default function Preview() {
  return (
    <section className="w-full px-4 md:px-6 h-full ">
      <div className="w-full max-w-210.75 mx-auto h-full pt-12">
        <div className="flex justify-between">
          <BackLink className="mb-9.5 md:mb-3.5">Back to Dashboard</BackLink>

          <div className="flex gap-4">
            <Button className="rounded-lg w-full max-w-34.5 bg-cdcdce1 text-c0a0a0a">
              Download code
            </Button>

            <Button className="rounded-lg w-full max-w-34.5">Deploy</Button>
          </div>
        </div>

        <div>
            
        </div>
      </div>
    </section>
  );
}
