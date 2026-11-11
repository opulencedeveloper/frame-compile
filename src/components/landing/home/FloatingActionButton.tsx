import Button from "@/components/shared/Button";
import SmartImage from "@/components/shared/SmartImage";
import QuestionMark from "@/assets/icons/question-mark.svg";

export default function FloatingActionButton() {
  return (
    <Button className="rounded-full w-11.75 h-11 fixed right-5 bottom-7">
      <SmartImage
        preload={true}
        src={QuestionMark}
        alt="question"
        className="h-3.75 w-3.75"
        width={15}
        height={15}
      />
    </Button>
  );
}
