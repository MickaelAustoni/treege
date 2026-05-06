interface NodeImageProps {
  image?: string;
}

const NodeImage = ({ image }: NodeImageProps) => {
  if (!image) {
    return null;
  }

  return <img src={image} alt="" className="tg:pointer-events-none tg:my-2 tg:max-h-24 tg:w-full tg:rounded-md tg:object-cover" />;
};

export default NodeImage;
