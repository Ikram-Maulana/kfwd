import { Text } from "ink";

interface Props {
  name: string | undefined;
}

export default function App({ name = "Stranger" }: Props) {
  return (
    <Text>
      Hello, <Text color="green">{name}</Text>
    </Text>
  );
}
