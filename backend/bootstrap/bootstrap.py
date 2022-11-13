from imaginairy import imagine, imagine_image_files, ImaginePrompt, WeightedPrompt, generate_caption

prompts = [
    ImaginePrompt("a scenic landscape", seed=1, upscale=True, fix_faces=True, steps=1),
]
result = next(imagine(prompts, precision="full"))

caption = generate_caption(result.img)