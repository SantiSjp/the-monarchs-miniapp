import dynamic from "next/dynamic";

const SvgMap = dynamic(() => import("~/components/SvgMap"), { ssr: false });


type Props = {
  fid?: number;
};

export default function Page({ fid }: Props) {
  return <SvgMap fid={fid} />;
}