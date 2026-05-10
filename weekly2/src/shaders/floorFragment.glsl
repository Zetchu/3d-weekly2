uniform float uTime;
uniform vec3 uColor;
uniform vec2 uMouse;
varying vec2 vUv;

void main() {

    vec2 grid = fract(vUv * 40.0);
    float line = step(0.95, grid.x) + step(0.95, grid.y);
    

    float mouseDist = distance(vUv, uMouse * 0.5 + 0.5);
    float glow = 1.0 - smoothstep(0.0, 0.4, mouseDist);
    
  
    float rawPulse = sin(vUv.y * 15.0 - uTime * 2.5) * 0.5 + 0.5;
    float sharpPulse = pow(rawPulse, 8.0); // This math makes the wide wave very thin!
    

    vec3 finalColor = uColor * line;
    finalColor += uColor * glow * 0.5; // Boost mouse highlight slightly
    

    finalColor += uColor * sharpPulse * line * 1.5; 
    
    // Base grid is always faintly visible (0.15) so shadows can cast on it
    // The pulse and glow add extra brightness on top
    float alpha = line * (0.15 + sharpPulse * 0.8 + glow * 0.4);
    
    gl_FragColor = vec4(finalColor, alpha);
}