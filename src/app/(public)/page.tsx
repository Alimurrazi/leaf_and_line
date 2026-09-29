import { Container } from "@/components/layout/container";

export default function HomePage() {
  return (
    <Container className="py-16">
      <h1 className="text-[40px] md:text-[clamp(40px,5vw,70px)]">Stories worth getting lost in.</h1>
    </Container>
  );
}
